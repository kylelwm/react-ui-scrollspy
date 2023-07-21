import * as React from "react";
import { MutableRefObject, ReactNode, useEffect, useRef } from "react";
import { throttle } from "../utils/throttle";

interface ScrollSpyProps {
  children: ReactNode;

  // refs
  navContainerRef?: MutableRefObject<HTMLDivElement | null>;
  parentScrollContainerRef?: MutableRefObject<HTMLDivElement | null>;

  // throttle
  scrollThrottle?: number;

  // callback
  onUpdateCallback?: (id: string) => void;

  // offsets
  offsetTop?: number;
  offsetBottom?: number;

  // customize attributes
  useDataAttribute?: string;
  activeClass?: string;

  useBoxMethod?: boolean;
  updateHistoryStack?: boolean;
}

const ScrollSpy = ({
  children,

  // refs
  navContainerRef,
  parentScrollContainerRef,

  // throttle
  scrollThrottle = 300,

  // callback
  onUpdateCallback,

  // offsets
  offsetTop = 0,
  offsetBottom = 0,

  // customize attributes
  useDataAttribute = "to-scrollspy-id",
  activeClass = "active-scroll-spy",

  useBoxMethod = true,
  updateHistoryStack = true,
}: ScrollSpyProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // keeps track of the Id in navcontainer which is active
  // so as to not update classLists unless it has been updated
  const prevIdTracker = useRef("");

  const isVisible = (el: HTMLElement) => {
    const rectInView = el.getBoundingClientRect();

    if (useBoxMethod) {
      const useHeight = parentScrollContainerRef?.current
        ? parentScrollContainerRef?.current.offsetHeight
        : window.innerHeight;
      const hitbox_top = useHeight;
      const element_top = rectInView.top;
      const element_bottom = rectInView.top + useHeight;

      return (
        hitbox_top < element_bottom + offsetBottom &&
        hitbox_top > element_top - offsetTop
      );
    } else {
      // this decides how much of the element should be visible
      const leniency = parentScrollContainerRef?.current
        ? parentScrollContainerRef?.current.offsetHeight * 0.5
        : window.innerHeight * 0.5;

      const useHeight = parentScrollContainerRef?.current
        ? parentScrollContainerRef?.current.offsetHeight
        : window.innerHeight;

      return (
        rectInView.top + leniency + offsetTop >= 0 &&
        rectInView.bottom - leniency - offsetBottom <= useHeight
      );
    }
  };

  const checkAndUpdateActiveScrollSpy = () => {
    const navContainerItems = navContainerRef
      ? navContainerRef.current?.querySelectorAll(`[data-${useDataAttribute}]`)
      : document.querySelectorAll(`[data-${useDataAttribute}]`);

    const scrollParentContainer = scrollContainerRef.current;

    // if there are no children, return
    if (!(scrollParentContainer && navContainerItems)) return;

    // loop over all children in scroll container
    for (let i = 0; i < scrollParentContainer.children.length; i++) {
      // get child element
      const useChild = scrollParentContainer.children.item(i) as HTMLDivElement;

      const elementIsVisible = isVisible(useChild);

      // check if the element is in the viewport
      if (elementIsVisible) {
        // if so, get its ID
        const changeHighlightedItemId = useChild.id;

        // if the element was same as the one currently active ignore it
        if (prevIdTracker.current === changeHighlightedItemId) return;

        // now loop over each element in the nav Container
        navContainerItems.forEach((el) => {
          const attrId = el.getAttribute(`data-${useDataAttribute}`);

          // if the element contains 'active' the class remove it
          if (el.classList.contains(activeClass)) {
            el.classList.remove(activeClass);
          }

          // check if its ID matches the ID we got from the viewport
          // also make sure it does not already contain the 'active' class
          if (
            attrId === changeHighlightedItemId &&
            !el.classList.contains(activeClass)
          ) {
            el.classList.add(activeClass);

            if (onUpdateCallback) {
              onUpdateCallback(changeHighlightedItemId);
            }

            prevIdTracker.current = changeHighlightedItemId;
            if (updateHistoryStack) {
              window.history.replaceState(
                {},
                "",
                `#${changeHighlightedItemId}`
              );
            }
          }
        });
        break;
      }
    }
  };

  useEffect(() => {
    // listen for scroll event
    parentScrollContainerRef
      ? // if ref for scrollable div is provided
        parentScrollContainerRef.current?.addEventListener(
          "scroll",
          throttle(checkAndUpdateActiveScrollSpy, scrollThrottle)
        )
      : // else listen for scroll in window
        window.addEventListener(
          "scroll",
          throttle(checkAndUpdateActiveScrollSpy, scrollThrottle)
        );
    return () => {
      // remove event listener
      parentScrollContainerRef
        ? parentScrollContainerRef.current?.removeEventListener(
            "scroll",
            throttle(checkAndUpdateActiveScrollSpy, scrollThrottle)
          )
        : window.removeEventListener(
            "scroll",
            throttle(checkAndUpdateActiveScrollSpy, scrollThrottle)
          );
    };
  });

  return <div ref={scrollContainerRef}>{children}</div>;
};

export default ScrollSpy;
