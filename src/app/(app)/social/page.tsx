"use client";

import { useState } from "react";
import { FriendCard } from "@/components/social/FriendCard";
import { FeedCard } from "@/components/social/FeedCard";
import { CompareModal } from "@/components/social/CompareModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { mockFriends, mockFeedEvents } from "@/data/mockData";
import { Globe } from "lucide-react";
import { UserPlus, Users, Activity, Search, Bell } from "lucide-react";

const TABS = ["Feed", "Friends", "Requests"];

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("Feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [addRequestSent, setAddRequestSent] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredFriends = (mockFriends as any[]).filter(
    (f) =>
      !searchQuery ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.specialty || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.institution || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCompare = (friend: any) => {
    setSelectedFriend(friend);
    setCompareModalOpen(true);
  };

  const handleAddFriend = (userId: string) => {
    setAddRequestSent((prev) => [...prev, userId]);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Social</h1>
          <p className="text-[#94a3b8] text-sm mt-0.5">
            Connect with colleagues and share milestones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2.5 bg-[#16161f] border border-[#1e2130] rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] rounded-full text-white text-xs flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f1f5f9]">{mockFriends.length}</p>
          <p className="text-xs text-[#64748b] mt-0.5">Friends</p>
        </div>
        <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f1f5f9]">{mockFeedEvents.length}</p>
          <p className="text-xs text-[#64748b] mt-0.5">Feed Events</p>
        </div>
        <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#f59e0b]">2</p>
          <p className="text-xs text-[#64748b] mt-0.5">Pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e2130]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
              activeTab === tab
                ? "border-[#2563eb] text-[#f1f5f9]"
                : "border-transparent text-[#64748b] hover:text-[#94a3b8]"
            }`}
          >
            {tab}
            {tab === "Requests" && (
              <span className="ml-1.5 w-4 h-4 bg-[#ef4444] rounded-full text-white text-xs inline-flex items-center justify-center">
                2
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed Tab */}
      {activeTab === "Feed" && (
        <div className="space-y-3">
          {mockFeedEvents.length > 0 ? (
            mockFeedEvents.map((event) => (
              <FeedCard key={event.id} event={event} />
            ))
          ) : (
            <EmptyState
              icon={Globe}
              title="No feed events yet"
              description="Add friends to see their updates here"
            />
          )}
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === "Friends" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16161f] border border-[#1e2130] text-[#f1f5f9] placeholder-[#64748b] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>

          {filteredFriends.length > 0 ? (
            <div className="space-y-3">
              {filteredFriends.map((friend) => (
                <FriendCard
                  key={friend.userId}
                  friend={friend}
                  onCompare={() => handleCompare(friend)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No friends found"
              description="Add colleagues to see their stats"
            />
          )}

          {/* Suggested connections */}
          <div className="bg-[#111118] border border-[#1e2130] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#f1f5f9] mb-3">Suggested Colleagues</h3>
            <div className="space-y-3">
              {[
                { id: "s1", name: "Dr. M. Okonkwo", spec: "Urology · PGY-2 · Sunnybrook" },
                { id: "s2", name: "Dr. P. Patel", spec: "General Surgery · PGY-5 · St. Michael's" },
                { id: "s3", name: "Dr. L. Nguyen", spec: "Urology · Fellow · Sick Kids" },
              ].map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {s.name.split(" ")[1][0]}{s.name.split(" ")[2][0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f1f5f9]">{s.name}</p>
                      <p className="text-xs text-[#64748b]">{s.spec}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(s.id)}
                    disabled={addRequestSent.includes(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      addRequestSent.includes(s.id)
                        ? "bg-[#16161f] text-[#64748b] cursor-not-allowed"
                        : "bg-[#1a1a2e] border border-[#2563eb]/40 text-[#3b82f6] hover:bg-[#2563eb] hover:text-white"
                    }`}
                  >
                    <UserPlus className="w-3 h-3" />
                    {addRequestSent.includes(s.id) ? "Sent" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "Requests" && (
        <div className="space-y-3">
          {[
            { id: "r1", name: "Dr. T. Liu", spec: "Urology · PGY-3 · Toronto General", sentAt: "2 days ago" },
            { id: "r2", name: "Dr. A. Sharma", spec: "General Surgery · PGY-4 · St. Joe's", sentAt: "5 days ago" },
          ].map((req) => (
            <div key={req.id} className="bg-[#111118] border border-[#1e2130] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {req.name.split(" ")[1][0]}{req.name.split(" ")[2][0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[#f1f5f9]">{req.name}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">{req.spec}</p>
                    <p className="text-xs text-[#64748b] mt-0.5">Sent {req.sentAt}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium rounded-lg transition-colors">
                    Accept
                  </button>
                  <button className="px-3 py-1.5 bg-[#16161f] border border-[#1e2130] text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-medium rounded-lg transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compare Modal */}
      {compareModalOpen && selectedFriend && (
        <CompareModal
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentUser={{ initials: "ME", name: "You", totalCases: 0, thisMonth: 0, firstSurgeonRate: 0, avgDuration: 0 } as any}
          friend={selectedFriend}
          onClose={() => setCompareModalOpen(false)}
        />
      )}
    </div>
  );
}
