/**
 * Performance Optimization Utilities
 * Helps optimize React components and API calls
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Higher-order component for memoization with custom comparison
 */
export const smartMemo = (Component, areEqual = null) => {
  return memo(Component, areEqual);
};

/**
 * Debounce hook for API calls and search
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Throttle hook for scroll events and resize
 */
export const useThrottle = (callback, delay) => {
  const lastCallRef = useRef(0);

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isIntersecting];
};

/**
 * Optimized image loader with lazy loading
 */
export const OptimizedImage = ({ src, alt, className, placeholder = true, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return (
    <div ref={ref} className={`relative ${className || ''}`} {...props}>
      {isIntersecting && (
        <>
          {!isLoaded && placeholder && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={hasError ? '/placeholder-image.jpg' : src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

/**
 * Virtual list hook for large datasets
 */
export const useVirtualList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll
  };
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
      );
    }
    
    renderStartTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: performance.now() - renderStartTime.current
  };
};

/**
 * Optimized pagination hook
 */
export const useOptimizedPagination = (fetchData, initialPage = 1, pageSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const cacheRef = useRef(new Map());

  const loadPage = useCallback(async (pageNum) => {
    if (cacheRef.current.has(pageNum)) {
      setData(cacheRef.current.get(pageNum));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(pageNum, pageSize);
      const newData = Array.isArray(result) ? result : result.data || [];
      
      setData(newData);
      cacheRef.current.set(pageNum, newData);
      setHasMore(newData.length === pageSize);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchData, pageSize]);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const nextPage = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const prevPage = useCallback(() => {
    if (!loading && page > 1) {
      setPage(prev => prev - 1);
    }
  }, [loading, page]);

  const goToPage = useCallback((pageNum) => {
    if (!loading && pageNum >= 1) {
      setPage(pageNum);
    }
  }, [loading]);

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
    refresh: () => loadPage(page)
  };
};

/**
 * Resource preloading utility
 */
export const preloadResource = (url, type = 'image') => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    link.onload = resolve;
    link.onerror = reject;
    
    document.head.appendChild(link);
  });
};

/**
 * Critical CSS inliner utility
 */
export const inlineCriticalCSS = (css) => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }
};
