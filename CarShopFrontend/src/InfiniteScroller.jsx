import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * InfiniteScroller - A component that handles infinite scrolling functionality
 * This is a more reliable implementation that ensures consistent batch loading
 */
const InfiniteScroller = ({ 
  onLoadMore,
  hasMore,
  loading,
  batchSize = 16,
  loadingComponent,
  endMessage
}) => {
  const loaderRef = useRef(null);
  const [visibilityCount, setVisibilityCount] = useState(0);
  
  // Improved visibility counter to prevent too many loads
  const visibilityTimeout = useRef(null);
  
  const handleObserver = useCallback((entries) => {
    const [entry] = entries;
    
    // If the element is visible and we're not loading
    if (entry.isIntersecting && !loading && hasMore) {
      // Don't trigger multiple times quickly
      if (visibilityTimeout.current) {
        clearTimeout(visibilityTimeout.current);
      }
      
      // Count visibility events - helps with debouncing
      setVisibilityCount(count => count + 1);
      
      // Only trigger load after a short delay to prevent rapid multi-loading
      visibilityTimeout.current = setTimeout(() => {
        console.log("InfiniteScroller: Loading more items...");
        onLoadMore(batchSize);
      }, 300);
    }
  }, [loading, hasMore, onLoadMore, batchSize]);
  
  // Set up the intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { 
      threshold: 0.1,  // 10% of the element needs to be visible
      rootMargin: '100px' // Start loading when 100px away from viewport
    });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
      if (visibilityTimeout.current) {
        clearTimeout(visibilityTimeout.current);
      }
    };
  }, [handleObserver]);
  
  return (
    <div className="infinite-scroll-component">
      <div ref={loaderRef} className="infinite-scroll-loader">
        {loading ? (
          loadingComponent || (
            <>
              <div className="spinner-small"></div>
              <span>Loading more items...</span>
            </>
          )
        ) : hasMore ? (
          <p>Scroll to load more...</p>
        ) : (
          endMessage || <p>All items loaded</p>
        )}
      </div>
    </div>
  );
};

export default InfiniteScroller;