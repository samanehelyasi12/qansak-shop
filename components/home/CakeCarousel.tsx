"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * CakeCarousel
 * -------------
 * Left-column visual for a two-part hero (right side = headline/copy,
 * left side = this component). Cycles through 3 cake images with the
 * same layered center / side / back staging as the original TOONHUB
 * carousel, but with the background-color swap, ghost "3D SHAPE" text,
 * brand label, and bottom copy all removed — only the image stage and
 * the two nav buttons remain.
 */

const IMAGES = [
  { src: "/images/hero/cake1.webp" },
  { src: "/images/hero/cake2.webp" },
  { src: "/images/hero/cake3.webp" },
  { src: "/images/hero/cake4.webp" },

];

type Role = "center" | "left" | "right" | "back";

function getRole(index: number, activeIndex: number, total: number): Role {
  const center = activeIndex;
  const left = (activeIndex + total - 1) % total;
  const right = (activeIndex + 1) % total;
  if (index === center) return "center";
  if (index === left) return "left";
  if (index === right) return "right";
  return "back";
}

function roleStyle(role: Role, isMobile: boolean): React.CSSProperties {
  switch (role) {
    case "center":
      return {
        left: "50%",
        transform: `translateX(-50%) scale(${isMobile ? .9 : 1})`,
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 20,
        height: isMobile ? "58%" : "75%",
        bottom: isMobile ? "30%" : "15%",
      };
    case "left":
      return {
        left: isMobile ? "14%" : "18%",
        transform: "translateX(-50%) scale(1)",
        filter: "blur(2px)",
        opacity: 0.85,
        zIndex: 10,
        height: isMobile ? "15%" : "26%",
        bottom: isMobile ? "30%" : "10%",
      };
    case "right":
      return {
        left: isMobile ? "86%" : "82%",
        transform: "translateX(-50%) scale(1)",
        filter: "blur(2px)",
        opacity: 0.85,
        zIndex: 10,
        height: isMobile ? "15%" : "26%",
        bottom: isMobile ? "30%" : "10%",
      };
    case "back":
    default:
      return {
        left: "50%",
        transform: "translateX(-50%) scale(1)",
        filter: "blur(4px)",
        opacity: 1,
        zIndex: 5,
        height: isMobile ? "12%" : "20%",
        bottom: isMobile ? "30%" : "10%",
      };
  }
}

export default function CakeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  const lockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    return () => {
      if (lockTimeout.current) clearTimeout(lockTimeout.current);
    };
  }, []);

  const navigate = (direction: "next" | "prev") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) =>
      direction === "next"
        ? (prev + 1) % IMAGES.length
        : (prev + IMAGES.length - 1) % IMAGES.length,
    );
    lockTimeout.current = setTimeout(() => setIsAnimating(false), 650);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* image stage */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        {IMAGES.map((img, index) => {
          const role = getRole(index, activeIndex, IMAGES.length);
          const style = roleStyle(role, isMobile);
          return (
            <div
              key={img.src}
              className="absolute"
              style={{
                aspectRatio: "0.85 / 1",
                transition:
                  "transform 650ms cubic-bezier(0.4,0,0.2,1), filter 650ms cubic-bezier(0.4,0,0.2,1), opacity 650ms cubic-bezier(0.4,0,0.2,1), left 650ms cubic-bezier(0.4,0,0.2,1)",
                willChange: "transform, filter, opacity",
                ...style,
              }}
            >
              <Image
                src={img.src}
                alt=""
                fill
                className="mt-[-70px]"
                draggable={false}
                priority={index === activeIndex}
                sizes="(max-width: 640px) 60vw, 30vw"
                style={{
                  objectFit: "contain",
                  objectPosition: "bottom center",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* nav buttons */}
      <div
        className="absolute bottom-6 ml-28 mb-[-38px] sm:bottom-10 sm:left-8 flex gap-3"
        style={{ zIndex: 40 }}
      >
        <button
          type="button"
          aria-label="تصویر قبلی"
          onClick={() => navigate("prev")}
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center transition-[transform,background-color] duration-150 hover:scale-105"
          style={{
            borderColor: "rgba(0,0,0,0.25)",
            color: "#3a3a3a",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <ArrowRight size={21} strokeWidth={2.0} />
        </button>
        <button
          type="button"
          aria-label="تصویر بعدی"
          onClick={() => navigate("next")}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center transition-[transform,background-color] duration-150 hover:scale-105"
          style={{
            borderColor: "rgba(0,0,0,0.25)",
            color: "#3a3a3a",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <ArrowLeft size={22} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
