"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/shared/lib/utils';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Number of items to render outside visible area
  onScroll?: (scrollTop: number) => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  isLoading?: boolean;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loadingComponent,
  emptyComponent,
  isLoading = false,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return {
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;
    
    let scrollTop: number;
    
    switch (align) {
      case 'center':
        scrollTop = (index * itemHeight) - (containerHeight / 2) + (itemHeight / 2);
        break;
      case 'end':
        scrollTop = (index * itemHeight) - containerHeight + itemHeight;
        break;
      default:
        scrollTop = index * itemHeight;
    }
    
    scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight));
    containerRef.current.scrollTop = scrollTop;
    setScrollTop(scrollTop);
  }, [itemHeight, containerHeight, totalHeight]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const items_slice = items.slice(startIndex, endIndex + 1);
    return items_slice.map((item, index) => (
      <div
        key={startIndex + index}
        style={{
          height: itemHeight,
          position: 'absolute',
          top: (startIndex + index) * itemHeight,
          left: 0,
          right: 0,
        }}
        className="virtual-scroll-item"
      >
        {renderItem(item, startIndex + index)}
      </div>
    ));
  }, [items, startIndex, endIndex, itemHeight, renderItem]);

  // Loading state
  if (isLoading && loadingComponent) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: containerHeight }}>
        {loadingComponent}
      </div>
    );
  }

  // Empty state
  if (!isLoading && items.length === 0 && emptyComponent) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: containerHeight }}>
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto scrollbar-thin", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

// Hook for virtual scrolling with infinite loading
export function useVirtualScroll<T>({
  items,
  loadMore,
  hasMore,
  threshold = 0.8,
}: {
  items: T[];
  loadMore: () => void;
  hasMore: boolean;
  threshold?: number;
}) {
  const handleScroll = useCallback((scrollTop: number) => {
    // Trigger load more when near bottom
    const scrollHeight = items.length * 50; // Assuming 50px item height
    const clientHeight = 400; // Assuming 400px container height
    const scrollRatio = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollRatio >= threshold && hasMore) {
      loadMore();
    }
  }, [items.length, loadMore, hasMore, threshold]);

  return { handleScroll };
}

// Optimized table row component for virtual scrolling
export interface VirtualTableRowProps {
  children: React.ReactNode;
  index: number;
  isSelected?: boolean;
  onClick?: (index: number) => void;
  className?: string;
}

export const VirtualTableRow: React.FC<VirtualTableRowProps> = React.memo(({
  children,
  index,
  isSelected,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center w-full px-4 py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150",
        isSelected && "bg-blue-50 border-blue-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={() => onClick?.(index)}
    >
      {children}
    </div>
  );
});

VirtualTableRow.displayName = 'VirtualTableRow';

// Example usage component
export const VirtualScrollExample: React.FC = () => {
  const [items] = useState(() => 
    Array.from({ length: 10000 }, (_, i) => ({ 
      id: i, 
      name: `Item ${i}`, 
      value: Math.random() * 1000 
    }))
  );

  const renderItem = useCallback((item: any, index: number) => (
    <VirtualTableRow key={item.id} index={index}>
      <div className="flex-1">{item.name}</div>
      <div className="w-20 text-right">{item.value.toFixed(2)}</div>
    </VirtualTableRow>
  ), []);

  return (
    <VirtualScroll
      items={items}
      itemHeight={50}
      containerHeight={400}
      renderItem={renderItem}
      className="border rounded-lg"
    />
  );
};
