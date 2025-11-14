import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Plus, Users as UsersIcon, Loader2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { type ChatGroup, type ChatMessage, UserRole } from "@shared/schema";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

export default function ChatPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Fetch chat groups
  const { data: chatGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/chat/groups", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const groupsQuery = query(
        collection(firestore, "chatGroups"),
        where("members", "array-contains", currentUser.id)
      );
      const snapshot = await getDocs(groupsQuery);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatGroup[];
    },
  });

  // Fetch all users (for Manager/Admin to create groups)
  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const usersSnapshot = await getDocs(collection(firestore, "users"));
      return usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    enabled: currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER,
  });

  // Fetch messages for selected group
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat/messages", selectedGroup],
    queryFn: async () => {
      if (!selectedGroup) return [];
      
      const messagesQuery = query(
        collection(firestore, "chatMessages"),
        where("groupId", "==", selectedGroup),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(messagesQuery);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
    },
    enabled: !!selectedGroup,
  });

  // Real-time message updates
  useEffect(() => {
    if (!selectedGroup) return;

    const messagesQuery = query(
      collection(firestore, "chatMessages"),
      where("groupId", "==", selectedGroup),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const updatedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];

      queryClient.setQueryData(["/api/chat/messages", selectedGroup], updatedMessages);
    });

    return () => unsubscribe();
  }, [selectedGroup, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!currentUser || !selectedGroup) return;

      const newMessage = {
        groupId: selectedGroup,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderEmail: currentUser.email,
        message: message.trim(),
        timestamp: Date.now(),
      };

      await addDoc(collection(firestore, "chatMessages"), newMessage);
    },
    onSuccess: () => {
      setMessageText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !newGroupName.trim()) return;

      const memberIds = currentUser.id ? [currentUser.id, ...selectedMembers] : selectedMembers;
      const uniqueMembers = Array.from(new Set(memberIds));

      const newGroup = {
        name: newGroupName.trim(),
        createdBy: currentUser.id,
        createdByName: currentUser.displayName,
        createdAt: Date.now(),
        members: uniqueMembers,
      };

      await addDoc(collection(firestore, "chatGroups"), newGroup);
    },
    onSuccess: () => {
      toast({
        title: "Group Created",
        description: "Chat group has been created successfully",
      });
      setNewGroupName("");
      setSelectedMembers([]);
      setCreateGroupOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/count"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && selectedGroup) {
      sendMessageMutation.mutate(messageText);
    }
  };

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createGroupMutation.mutate();
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectedGroupData = chatGroups?.find((g) => g.id === selectedGroup);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="page-title">Chat</h1>
          <p className="text-muted-foreground mt-2">
            Real-time messaging with your team
          </p>
        </div>
        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
          <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-group">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Chat Group</DialogTitle>
                <DialogDescription>
                  Create a new group and add team members
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="Team Discussion"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    data-testid="input-group-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Select Members</Label>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    <div className="space-y-2">
                      {allUsers?.filter((user) => user.id !== currentUser?.id).map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                        >
                          <Checkbox
                            id={user.id}
                            checked={selectedMembers.includes(user.id)}
                            onCheckedChange={() => toggleMember(user.id)}
                            data-testid={`checkbox-member-${user.id}`}
                          />
                          <Label
                            htmlFor={user.id}
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.displayName}</p>
                              <p className="text-xs text-muted-foreground">{user.role}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || createGroupMutation.isPending}
                  data-testid="button-submit-create-group"
                >
                  {createGroupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Your Groups</CardTitle>
            <CardDescription>Select a group to view messages</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {groupsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !chatGroups || chatGroups.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No groups yet</p>
                </div>
              ) : (
                <div>
                  {chatGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className={`w-full flex items-center gap-3 p-4 hover-elevate border-b ${
                        selectedGroup === group.id ? "bg-accent" : ""
                      }`}
                      data-testid={`group-${group.id}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Hash className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.members.length} members
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          {!selectedGroup ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a group to start chatting</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose a group from the list to view messages
                </p>
              </div>
            </div>
          ) : (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedGroupData?.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      {selectedGroupData?.members.length} members
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[540px]">
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-16 w-full max-w-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !messages || messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No messages yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Start the conversation!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === currentUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                            data-testid={`message-${message.id}`}
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback>
                                {getInitials(message.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${isOwn ? "flex flex-col items-end" : ""}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {message.senderName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div
                                className={`rounded-2xl px-4 py-2 max-w-md ${
                                  isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm break-words">{message.message}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                <Separator />
                <form onSubmit={handleSendMessage} className="p-4 flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
