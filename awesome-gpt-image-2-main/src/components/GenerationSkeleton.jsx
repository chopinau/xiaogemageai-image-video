import React from 'react';
import { Loader } from 'lucide-react';

export function GenerationSkeleton({ type = 'image', count = 4 }) {
  return (
    <div className="generationSkeleton">
      <div className="generationSkeletonHeader">
        <Loader size={16} className="spin" />
        <span>AI 正在创作中...</span>
      </div>
      <div className="generationSkeletonGrid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="generationSkeletonCard">
            <div className="generationSkeletonImage" />
            <div className="generationSkeletonMeta">
              <div className="generationSkeletonLine short" />
              <div className="generationSkeletonLine" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
