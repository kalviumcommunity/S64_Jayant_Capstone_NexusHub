import React, { useState } from "react";
import AnimatedTitle from "../components/AnimatedTitle";
import Button from "../components/Button";

const TABS = ["Users", "Teams", "Projects", "Posts"];

// Mock data for showcase
const MOCK_USERS = [
  { id: 1, name: "Jayant Kumawat", username: "jayantk", bio: "UI/UX Designer & Developer" },
  { id: 2, name: "Priyanshi Sharma", username: "priyanshi", bio: "Frontend Engineer" },
  { id: 3, name: "Aman Gupta", username: "amang", bio: "Full Stack Dev" },
];
const MOCK_TEAMS = [
  { id: 1, name: "Design Wizards", members: 8, description: "Creative design team" },
  { id: 2, name: "Code Ninjas", members: 12, description: "Elite coding squad" },
];
const MOCK_PROJECTS = [
  { id: 1, title: "NexusHub Redesign", status: "In Progress", description: "UI/UX overhaul for NexusHub" },
  { id: 2, title: "Team Portal", status: "Completed", description: "Internal team management tool" },
];
const MOCK_POSTS = [
  { id: 1, author: "Jayant Kumawat", content: "Just finished the new dashboard UI! 🚀" },
  { id: 2, author: "Priyanshi Sharma", content: "Looking for feedback on our latest design system." },
];

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Users");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setSearched(true);
    let filtered = [];
    const q = search.toLowerCase();
    if (activeTab === "Users") {
      filtered = MOCK_USERS.filter(
        u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q)
      );
    } else if (activeTab === "Teams") {
      filtered = MOCK_TEAMS.filter(
        t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    } else if (activeTab === "Projects") {
      filtered = MOCK_PROJECTS.filter(
        p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.status.toLowerCase().includes(q)
      );
    } else if (activeTab === "Posts") {
      filtered = MOCK_POSTS.filter(
        p => p.author.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
      );
    }
    setResults(filtered);
  };

  // Reset results when tab changes or search is cleared
  React.useEffect(() => {
    setResults([]);
    setSearched(false);
    setSearch("");
  }, [activeTab]);

  return (
    <div className="min-h-screen w-full px-4 py-8 md:px-12 bg-neutral-100 dark:bg-neutral-900 font-general transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <AnimatedTitle title="Explore" containerClass="mb-8" />
        <form className="flex flex-col md:flex-row items-center gap-4 mb-8" onSubmit={e => { e.preventDefault(); handleSearch(); }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="w-full md:w-96 px-5 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-general text-base focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm transition"
          />
          <Button
            title="Search"
            containerClass="bg-purple-600 text-white px-8 py-3 rounded-full font-general text-base shadow-md hover:bg-purple-700 transition"
            onClick={handleSearch}
          />
        </form>
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map(tab => (
            <Button
              key={tab}
              title={tab}
              containerClass={`px-6 py-2 rounded-full font-general text-sm shadow-sm transition border border-transparent ${activeTab === tab ? "bg-purple-600 text-white" : "bg-violet-50 text-black dark:bg-neutral-800 dark:text-neutral-200"}`}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
        <div className="mt-8">
          {activeTab === "Users" && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-8 text-neutral-700 dark:text-neutral-200 min-h-[120px]">
              {searched ? (
                results.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.map(user => (
                      <div key={user.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-5 flex flex-col gap-2">
                        <span className="font-bold text-lg text-purple-700 dark:text-purple-400">{user.name}</span>
                        <span className="text-sm text-neutral-500">@{user.username}</span>
                        <span className="text-base">{user.bio}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-neutral-400">No users found.</div>
                )
              ) : (
                <div className="text-center text-neutral-400">User search results will appear here.</div>
              )}
            </div>
          )}
          {activeTab === "Teams" && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-8 text-neutral-700 dark:text-neutral-200 min-h-[120px]">
              {searched ? (
                results.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.map(team => (
                      <div key={team.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-5 flex flex-col gap-2">
                        <span className="font-bold text-lg text-purple-700 dark:text-purple-400">{team.name}</span>
                        <span className="text-sm text-neutral-500">{team.members} members</span>
                        <span className="text-base">{team.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-neutral-400">No teams found.</div>
                )
              ) : (
                <div className="text-center text-neutral-400">Team search results will appear here.</div>
              )}
            </div>
          )}
          {activeTab === "Projects" && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-8 text-neutral-700 dark:text-neutral-200 min-h-[120px]">
              {searched ? (
                results.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.map(project => (
                      <div key={project.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-5 flex flex-col gap-2">
                        <span className="font-bold text-lg text-purple-700 dark:text-purple-400">{project.title}</span>
                        <span className="text-sm text-neutral-500">Status: {project.status}</span>
                        <span className="text-base">{project.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-neutral-400">No projects found.</div>
                )
              ) : (
                <div className="text-center text-neutral-400">Project search results will appear here.</div>
              )}
            </div>
          )}
          {activeTab === "Posts" && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-8 text-neutral-700 dark:text-neutral-200 min-h-[120px]">
              {searched ? (
                results.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {results.map(post => (
                      <div key={post.id} className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-5 flex flex-col gap-2">
                        <span className="font-bold text-lg text-purple-700 dark:text-purple-400">{post.author}</span>
                        <span className="text-base">{post.content}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-neutral-400">No posts found.</div>
                )
              ) : (
                <div className="text-center text-neutral-400">Post search results will appear here.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 