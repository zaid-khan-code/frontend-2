import React from "react";
import { Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { useAuthStore } from "../store/useAuthStore";

function formatDate(value?: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AnnouncementsFeed() {
  const { announcements, isLoading, isError } = useAnnouncements({ active: true });
  const canManageAnnouncements = useAuthStore((state) => state.hasPermission("announcements:write"));

  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Announcements</div>
          <div className="pg-sub">Official organization updates from the backend announcement feed.</div>
        </div>
        {canManageAnnouncements && (
          <Link className="btn btn-primary" to="/announcements/manage">
            Manage Announcements
          </Link>
        )}
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>
            Loading announcements...
          </div>
        ) : isError ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--red)" }}>
            Could not load announcements.
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>
            <Megaphone size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>No announcements are published right now.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {announcements.map((post) => (
              <article
                key={post.id}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid var(--br2)",
                  background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(248,250,252,.78))",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, color: "var(--t1)" }}>{post.title}</h3>
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--t3)" }}>
                      Published {formatDate(post.created_at)}
                    </div>
                  </div>
                </div>
                <p style={{ color: "var(--t2)", lineHeight: 1.6, margin: "12px 0 0" }}>{post.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
