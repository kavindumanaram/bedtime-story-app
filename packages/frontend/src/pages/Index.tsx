import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { CommunityStory } from "@bedtime/shared";
import { loadStories, type GeneratedStory } from "../api/storyDb";

// Force a specific tile image for Index tiles (developer-specified)
const FORCE_TILE_IMAGE =
  "https://zxhbmvyyqyjjbijzdbzy.supabase.co/storage/v1/object/public/story-references/scenes/1778157367142-0.png";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "adventure", label: "Adventure" },
  { id: "fantasy", label: "Fantasy" },
  { id: "animals", label: "Animals" },
  { id: "space", label: "Space" },
  { id: "ocean", label: "Ocean" },
];

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60) return `${d}m ago`;
  const h = Math.floor(d / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const RailCard: React.FC<{ s: CommunityStory }> = ({ s }) => {
  const img = FORCE_TILE_IMAGE
  return (
    <div style={{ width: 320, minWidth: 320, marginRight: 16, borderRadius: 16, overflow: 'hidden', boxShadow: '0 28px 90px rgba(16,24,40,0.16)', background: '#fff' }}>
      {img ? (
        <img src={img} alt={s.title} style={{ width: '100%', height: 190, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 190, background: 'linear-gradient(135deg,#e9d5ff,#c7e9ff)' }} />
      )}
      <div style={{ padding: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.8))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0b1220', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
            <div style={{ marginTop: 6, color: '#6B7280', fontSize: 12 }}>{s.ageMin ? `Age ${s.ageMin}+` : ''} • {timeAgo(s.createdAt)}</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play style={{ width: 16, height: 16, color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  )
};

const UserRailCard: React.FC<{ s: GeneratedStory; onPlay: () => void }> = ({ s, onPlay }) => {
  const img = FORCE_TILE_IMAGE
  return (
    <div style={{ width: 320, minWidth: 320, marginRight: 16, borderRadius: 16, overflow: 'hidden', boxShadow: '0 28px 90px rgba(16,24,40,0.16)', background: '#fff' }}>
      {img ? (
        <img src={img} alt={s.title} style={{ width: '100%', height: 190, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: 190, background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }} />
      )}
      <div style={{ padding: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0b1220', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
            <div style={{ marginTop: 6, color: '#6B7280', fontSize: 12 }}>{s.childName ? `${s.childName}` : ''} • {timeAgo(s.createdAt)}</div>
          </div>
          <button onClick={() => onPlay()} style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play style={{ width: 16, height: 16, color: '#fff' }} />
          </button>
        </div>
        <div style={{ marginTop: 8, height: 6, borderRadius: 99, background: 'linear-gradient(90deg,#fde68a,#fbcfe8)' }} />
      </div>
    </div>
  )
};

export const Index: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useAuth();
  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch("/api/community/stories?limit=80")
      .then((r) => r.json())
      .then((data: CommunityStory[]) => {
        setStories(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load user's own generated stories for "Continue Reading" rail
  const [userStories, setUserStories] = useState<GeneratedStory[]>([]);
  useEffect(() => {
    if (!activeChild) return;
    loadStories()
      .then((all) => {
        const mine = (all || [])
          .filter((s) => s.childName === activeChild.name)
          .slice(0, 8);
        setUserStories(mine);
      })
      .catch(() => {});
  }, [activeChild]);

  if (!activeChild) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#fbf8ff" }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0b1220" }}>
            Welcome to HushTales
          </h2>
          <p style={{ color: "#6B7280", marginTop: 8 }}>
            Select a child profile to continue to a personalised experience.
          </p>
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => navigate("/profiles")}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                border: "none",
                color: "#fff",
                fontWeight: 800,
              }}
            >
              Select Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cats = CATEGORIES;
  const byCategory = (catId: string) =>
    stories.filter((s) =>
      catId === "all" ? true : (s.theme ?? "").toLowerCase().includes(catId),
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#fbf8ff,#fff)",
        color: "#0b1220",
      }}
    >
      <div
        style={{ padding: "28px 20px 36px", maxWidth: 1200, margin: "0 auto" }}
      >
        {/* Hero - premium, light */}
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            background: "linear-gradient(180deg,#fff,#fbfbff)",
            padding: 20,
            borderRadius: 18,
            boxShadow: "0 20px 60px rgba(16,24,40,0.06)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#7c3aed",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Curated for {activeChild.name}
            </div>
            <h1
              style={{
                fontSize: 34,
                fontWeight: 900,
                marginTop: 8,
                color: "#0b1220",
              }}
            >
              A cinematic bedtime experience
            </h1>
            <p style={{ marginTop: 10, color: "#6B7280", maxWidth: 560 }}>
              Polished, illustrated covers and immersive story rails — community
              favourites and premium originals, made gentle for little
              listeners.
            </p>
            <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
              <button
                onClick={() => navigate("/library")}
                style={{
                  padding: "12px 22px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                Explore stories
              </button>
              <button
                onClick={() => navigate("/create")}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  background: "transparent",
                  border: "1px solid rgba(16,24,40,0.06)",
                  color: "#0b1220",
                }}
              >
                Create
              </button>
            </div>
          </div>

          <div
            style={{
              width: 380,
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* showcase three stacked covers */}
            <div
              style={{
                width: 180,
                height: 240,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 18px 40px rgba(16,24,40,0.08)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg,#e9d5ff,#c7e9ff)",
                }}
              />
            </div>
            <div
              style={{
                width: 180,
                height: 240,
                borderRadius: 12,
                overflow: "hidden",
                transform: "translateY(10px)",
                boxShadow: "0 22px 60px rgba(16,24,40,0.09)",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg,#fde68a,#fbcfe8)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Continue Reading rail (personalized) */}
        {userStories.length > 0 && (
          <section style={{ marginTop: 18, marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <h3 style={{ color: "#0b1220", fontWeight: 900 }}>
                Continue Reading
              </h3>
              <button
                onClick={() => navigate("/library")}
                style={{
                  color: "#7c3aed",
                  background: "none",
                  border: "none",
                  fontWeight: 700,
                }}
              >
                View all
              </button>
            </div>
            <div
              style={{ display: "flex", overflowX: "auto", paddingBottom: 8 }}
            >
              {userStories.map((s) => (
                <UserRailCard
                  key={s.id}
                  s={s}
                  onPlay={() => navigate(`/player/${s.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Category pills - premium look */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 10,
          }}
        >
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background:
                  activeCategory === c.id
                    ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
                    : "#fff",
                border:
                  activeCategory === c.id
                    ? "none"
                    : "1px solid rgba(16,24,40,0.06)",
                color: activeCategory === c.id ? "#fff" : "#0b1220",
                fontWeight: 700,
                boxShadow:
                  activeCategory === c.id
                    ? "0 8px 30px rgba(124,58,237,0.16)"
                    : "none",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Rails */}
        <div style={{ marginTop: 22 }}>
          {cats.map((cat) => {
            const list = byCategory(cat.id);
            if (list.length === 0) return null;
            return (
              <section key={cat.id} style={{ marginBottom: 26 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ color: "#0b1220", fontWeight: 900 }}>
                    {cat.label}
                  </h3>
                  <button
                    onClick={() => navigate("/library")}
                    style={{
                      color: "#7c3aed",
                      background: "none",
                      border: "none",
                      fontWeight: 700,
                    }}
                  >
                    View all
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    overflowX: "auto",
                    paddingBottom: 8,
                  }}
                >
                  {list.slice(0, 12).map((s) => (
                    <RailCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
