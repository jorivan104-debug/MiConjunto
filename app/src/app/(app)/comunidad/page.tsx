"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { communityPosts, formatDateTime } from "@/lib/mock-data";

export default function ComunidadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">Comunidad</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Novedades y conversaciones del conjunto
        </p>
      </div>

      {/* Post list */}
      <div className="space-y-4">
        {communityPosts.map((post) => (
          <Card key={post.id} padding="md">
            <div className="flex gap-3">
              <Avatar
                initials={post.avatar}
                size={post.author === "Administración" ? "md" : "md"}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text truncate">
                    {post.author}
                  </span>
                  {post.author === "Administración" && (
                    <span className="shrink-0 text-[10px] font-semibold bg-secondary-50 text-secondary px-1.5 py-0.5 rounded-full">
                      Oficial
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted">
                  {post.unit} · {formatDateTime(post.date)}
                </p>
              </div>
            </div>

            <p className="text-sm text-text leading-relaxed mt-3">
              {post.content}
            </p>

            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border">
              <button className="flex items-center gap-1.5 text-text-muted hover:text-danger transition-colors">
                <Heart size={16} strokeWidth={1.8} />
                <span className="text-xs font-medium">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-text-muted hover:text-secondary transition-colors">
                <MessageCircle size={16} strokeWidth={1.8} />
                <span className="text-xs font-medium">{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors ml-auto">
                <Share2 size={16} strokeWidth={1.8} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
