import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Github, Linkedin, Mail, ArrowDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: "Quantum UI",
    description: "A comprehensive design system featuring over 50 accessible, dark-mode ready components built with React and Tailwind.",
    tags: ["React", "TypeScript", "Tailwind", "Radix UI"],
    image: "/projects/quantum.png",
  },
  {
    title: "Orbit Dashboard",
    description: "Real-time analytics SaaS platform providing deep insights into user behavior and revenue metrics with stunning visualizations.",
    tags: ["Next.js", "Recharts", "Node.js", "PostgreSQL"],
    image: "/projects/orbit.png",
  },
  {
    title: "Cipher",
    description: "End-to-end encrypted note-taking application designed for privacy-conscious professionals and journalists.",
    tags: ["React Native", "WebCrypto", "Zustand"],
    image: "/projects/cipher.png",
  },
  {
    title: "Flux Motion",
    description: "A lightweight, declarative animation library for the modern web, focusing on performance and developer experience.",
    tags: ["TypeScript", "WebGL", "GSAP"],
    image: "/projects/flux.png",
  },
];

const skills = [
  "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "GSAP", "TailwindCSS", "Figma", "Three.js", "GraphQL"
];

export default function Portfolio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLHeadingElement>(null);
  const heroTaglineRef = useRef<HTMLParagraphElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Custom cursor
    if (!isReducedMotion) {
      const cursor = cursorRef.current;
      if (cursor) {
        const xTo = gsap.quickTo(cursor, "x", { duration: 0.2, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.2, ease: "power3" });

        window.addEventListener("mousemove", (e) => {
          xTo(e.clientX);
          yTo(e.clientY);
        });

        // Hover effects
        const interactiveElements = document.querySelectorAll('a, button, .project-card');
        interactiveElements.forEach((el) => {
          el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
          el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        });
      }
    }

    // Hero Text Stagger
    if (heroTextRef.current) {
      const chars = heroTextRef.current.innerText.split('');
      heroTextRef.current.innerText = '';
      chars.forEach(char => {
        const span = document.createElement('span');
        span.innerText = char === ' ' ? '\u00A0' : char;
        span.className = 'inline-block opacity-0 translate-y-8';
        heroTextRef.current?.appendChild(span);
      });

      gsap.to(heroTextRef.current.children, {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 1,
        ease: "power3.out",
        delay: 0.2
      });

      gsap.fromTo(heroTaglineRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, delay: 1, ease: "power2.out" }
      );
    }

    if (isReducedMotion) return;

    // Signature Moment: Pin hero and horizontal text marquee
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "+=150%",
        scrub: 1,
        pin: true,
      }
    });

    tl.to(heroTextRef.current, { scale: 0.8, opacity: 0.5, duration: 1 })
      .to(marqueeRef.current, { xPercent: -50, duration: 2 }, "<");

    // About Reveal
    gsap.fromTo(".about-element", 
      { opacity: 0, y: 50 },
      { 
        opacity: 1, y: 0, 
        stagger: 0.2, 
        duration: 1, 
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 80%",
        }
      }
    );

    // Projects Stagger
    gsap.fromTo(".project-card",
      { opacity: 0, y: 100 },
      {
        opacity: 1, y: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: projectsRef.current,
          start: "top 70%",
        }
      }
    );

    // Skills Reveal
    gsap.fromTo(".skill-item",
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1, scale: 1,
        stagger: 0.05,
        duration: 0.5,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: skillsRef.current,
          start: "top 80%",
        }
      }
    );

    // Contact Reveal
    gsap.fromTo(".contact-element",
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0,
        stagger: 0.2,
        duration: 0.8,
        scrollTrigger: {
          trigger: contactRef.current,
          start: "top 80%",
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="dark bg-background text-foreground min-h-screen font-sans selection:bg-primary selection:text-white overflow-hidden">
      {/* Custom Cursor */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-6 h-6 rounded-full border-2 border-primary pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out hidden md:block"
        style={{ mixBlendMode: 'difference' }}
      ></div>

      <style dangerouslySetInnerHTML={{__html: `
        .cursor-hover {
          transform: translate(-50%, -50%) scale(2) !important;
          background-color: hsl(var(--primary));
          border-color: transparent;
          opacity: 0.5;
        }
      `}} />

      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="z-10 text-center flex flex-col items-center">
          <h1 ref={heroTextRef} className="font-serif text-[12vw] leading-none font-bold tracking-tighter uppercase mb-6 text-white mix-blend-difference">
            ALEXANDER
          </h1>
          <p ref={heroTaglineRef} className="text-xl md:text-2xl font-medium text-muted-foreground max-w-2xl text-center">
            Front-end developer crafting interactive web experiences.
          </p>
        </div>

        {/* Marquee Background */}
        <div className="absolute top-1/2 left-0 w-[200vw] -translate-y-1/2 pointer-events-none opacity-5">
          <div ref={marqueeRef} className="flex whitespace-nowrap text-[15vw] font-serif font-bold uppercase tracking-tight text-white">
            <span className="mx-4">CRAFT</span>
            <span className="mx-4 text-primary">MOTION</span>
            <span className="mx-4">DESIGN</span>
            <span className="mx-4 text-primary">CODE</span>
            <span className="mx-4">CRAFT</span>
            <span className="mx-4 text-primary">MOTION</span>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ArrowDown size={32} />
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="about-element">
            <h2 className="font-serif text-4xl md:text-6xl font-bold mb-8 uppercase">Who I am</h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
              I am a design-minded software engineer focused on building beautiful, highly interactive interfaces. I believe the best products live at the intersection of robust engineering and thoughtful design.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              When I'm not pushing pixels or wrangling state, you can find me exploring typography, experimenting with WebGL, or studying architecture.
            </p>
          </div>
          <div className="about-element relative">
            <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full"></div>
            <blockquote className="relative font-serif text-3xl md:text-5xl font-bold leading-tight text-white italic">
              "Design is not just what it looks like and feels like. Design is how it works."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section ref={projectsRef} className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl md:text-6xl font-bold mb-20 uppercase">Selected Work</h2>
        
        <div className="flex flex-col gap-32">
          {projects.map((project, idx) => (
            <div key={idx} className="project-card group grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className={`lg:col-span-7 relative overflow-hidden rounded-lg aspect-video ${idx % 2 !== 0 ? 'lg:order-2' : ''}`}>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 mix-blend-overlay"></div>
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <div className={`lg:col-span-5 flex flex-col justify-center ${idx % 2 !== 0 ? 'lg:order-1 lg:text-right' : ''}`}>
                <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">{project.title}</h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {project.description}
                </p>
                <div className={`flex flex-wrap gap-3 ${idx % 2 !== 0 ? 'lg:justify-end' : ''}`}>
                  {project.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-full border border-border text-sm font-medium tracking-wide uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills Section */}
      <section ref={skillsRef} className="py-32 px-6 md:px-12 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-4xl md:text-6xl font-bold mb-16 uppercase text-center">Toolkit</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
            {skills.map(skill => (
              <div 
                key={skill} 
                className="skill-item text-2xl md:text-4xl font-serif font-bold py-4 px-8 rounded-2xl bg-background border border-border/50 hover:border-primary hover:text-primary transition-colors duration-300 cursor-default"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="py-40 px-6 md:px-12 max-w-7xl mx-auto text-center min-h-[80vh] flex flex-col items-center justify-center">
        <h2 className="contact-element font-serif text-5xl md:text-8xl font-bold uppercase mb-12 tracking-tighter">
          Let's build<br/><span className="text-primary">something remarkable.</span>
        </h2>
        
        <a 
          href="mailto:hello@yourname.dev" 
          className="contact-element text-2xl md:text-4xl font-medium border-b-2 border-primary pb-2 hover:text-primary transition-colors duration-300 mb-20"
        >
          hello@yourname.dev
        </a>
        
        <div className="contact-element flex gap-8">
          <a href="#" className="p-4 rounded-full border border-border hover:border-primary hover:text-primary transition-all duration-300 group">
            <Github size={24} className="group-hover:scale-110 transition-transform" />
          </a>
          <a href="#" className="p-4 rounded-full border border-border hover:border-primary hover:text-primary transition-all duration-300 group">
            <Linkedin size={24} className="group-hover:scale-110 transition-transform" />
          </a>
          <a href="#" className="p-4 rounded-full border border-border hover:border-primary hover:text-primary transition-all duration-300 group">
            <Mail size={24} className="group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </section>
    </div>
  );
}