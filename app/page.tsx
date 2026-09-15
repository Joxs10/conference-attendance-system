// app/page.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function LandingPage() {
  const containerRef = useRef(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef(null);

  useEffect(() => {
    // Usamos gsap.context para asegurar que React 18 no duplique las animaciones
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. ANIMACIÓN DEL PRELOADER (Apertura de CURP -> ConferenciaURP)
      tl.to('.middle-text', {
        maxWidth: '1000px', // Expandimos el espacio
        opacity: 1,
        duration: 1.5,
        ease: 'power4.inOut',
        delay: 0.5 // Pequeña pausa inicial para que el usuario lea "CURP"
      })
      
      // 2. DESAPARECER EL PRELOADER (Se desliza hacia arriba)
      .to('.preloader-screen', {
        yPercent: -100,
        duration: 1.2,
        ease: 'power3.inOut',
        display: 'none' // Lo quitamos del DOM visualmente al terminar
      }, "+=0.4") // Espera 0.4s después de abrir el texto
      
      // 3. ENTRAN LOS ELEMENTOS DEL HERO (Título y subtítulo)
      .fromTo(".hero-elem",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out" },
        "-=0.6" // Se adelanta un poco a que termine de subir el telón
      )
      
      // 4. ENTRAN LAS TARJETAS DE MÓDULOS
      .fromTo(cardsRef.current!.children,
        { opacity: 0, scale: 0.9, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "back.out(1.7)" },
        "-=0.6"
      );

      // 5. ANIMACIÓN DE REVELADO AL HACER SCROLL (About Us)
      const handleScroll = () => {
        if (aboutRef.current) {
          const top = (aboutRef.current as HTMLElement).getBoundingClientRect().top;
          if (top < window.innerHeight * 0.8) {
            gsap.to(aboutRef.current, { opacity: 1, y: 0, duration: 1, ease: "power2.out" });
            window.removeEventListener('scroll', handleScroll);
          }
        }
      };
      
      gsap.set(aboutRef.current, { opacity: 0, y: 50 });
      window.addEventListener('scroll', handleScroll);
      
      // Cleanup del event listener al desmontar
      return () => window.removeEventListener('scroll', handleScroll);

    }, containerRef); // Scope de la animación

    return () => ctx.revert(); // Limpiamos la memoria al salir de la página
  }, []);

  const panels = [
    { title: "Soy Alumno", desc: "Genera tu credencial QR de acceso y revisa tu cronograma de ponencias.", href: "/alumno", icon: "M12 14l9-5-9-5-9 5 9 5z" },
    { title: "Soy Ponente", desc: "Monitorea tu aula en tiempo real y gestiona la asistencia de tus estudiantes.", href: "/ponente", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { title: "Soy Admin", desc: "Consola Root. Gestiona eventos, inyecta registros y descarga analíticas en CSV.", href: "/admin", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen w-full bg-neutral-950 text-neutral-200 overflow-x-hidden font-sans selection:bg-indigo-500/30">
      
      {/* ---------------- PANTALLA DE PRECARGA (CURP -> ConferenciaURP) ---------------- */}
      <div className="preloader-screen fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center border-b border-white/5">
        <div className="flex items-center text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <span>C</span>
          {/* El contenedor que se expande */}
          <span className="middle-text opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
            onferencia
          </span>
          <span>URP</span>
        </div>
        <div className="mt-8 text-[10px] font-mono tracking-widest text-indigo-400 uppercase animate-pulse">
          Cargando entorno de arquitectura...
        </div>
      </div>
      {/* ------------------------------------------------------------------------------- */}

      {/* FONDO DE VIDEO GLOBAL */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(35,35,45,0.4)_0%,rgba(10,10,12,1)_80%)]" />
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen">
          <source src="/bg-admin.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-transparent to-neutral-950/95 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10">
        {/* NAVEGACIÓN SUPERIOR */}
        <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center hero-elem">
          <div className="text-xs font-mono font-bold tracking-[0.3em] text-indigo-400 uppercase">
            [ Core System ]
          </div>
          <div className="flex gap-6 text-xs font-mono text-neutral-400">
            <Link href="#about" className="hover:text-white transition-colors">About Us</Link>
            <Link href="/check" className="hover:text-emerald-400 transition-colors border border-neutral-800 px-3 py-1 rounded hover:border-emerald-500/50">Tótem Lector</Link>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">
          <p className="hero-elem text-[10px] font-mono tracking-widest text-neutral-500 uppercase mb-4">
            Gestión de Asistencia Biométrica e Inteligente
          </p>
          
          <h1 
            className="hero-elem text-6xl md:text-8xl lg:text-9xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 font-bold mb-8 drop-shadow-2xl"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            ConferenciaURP
          </h1>
          
          <p className="hero-elem text-neutral-400 max-w-2xl mx-auto font-light text-sm md:text-base mb-24">
            Un ecosistema arquitectónico de alta disponibilidad para el control, auditoría 
            y monitoreo en tiempo real de eventos académicos universitarios.
          </p>

          {/* PANELES DE MÓDULOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" ref={cardsRef}>
            {panels.map((panel, idx) => (
              <Link href={panel.href} key={idx} className="block relative group h-full">
                
                {/* ANIMACIÓN DE BORDE GIRATORIO */}
                <div className="absolute inset-0 rounded-[2rem] bg-neutral-800/50 group-hover:bg-gradient-to-r overflow-hidden transition-transform duration-500 group-hover:scale-[1.03]">
                  <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_270deg,#818cf8_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_3s_linear_infinite]"></div>
                </div>

                {/* CONTENIDO DE LA TARJETA */}
                <div className="relative h-full m-[2px] bg-neutral-950/90 backdrop-blur-2xl rounded-[calc(2rem-2px)] p-8 flex flex-col items-center justify-center text-center transition-transform duration-500 group-hover:scale-[1.03] border border-white/5 group-hover:border-transparent">
                  
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                    <svg className="w-8 h-8 text-neutral-400 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={panel.icon} />
                    </svg>
                  </div>
                  
                  <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {panel.title}
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                    {panel.desc}
                  </p>
                  
                  <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-400">Ingresar al Módulo →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ABOUT US & FOOTER SECTION */}
        <section id="about" className="py-24 px-6 border-t border-white/5 bg-neutral-950/80 backdrop-blur-lg" ref={aboutRef}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
            
            {/* ABOUT THE PROJECT */}
            <div>
              <h3 className="text-lg font-mono text-white font-bold uppercase tracking-widest mb-6">About Us</h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-light mb-4">
                ConferenciaURP nació de la necesidad de modernizar y asegurar el registro de asistencias 
                a eventos masivos. Sustituyendo las clásicas firmas en papel por un sistema de criptografía 
                ligera mediante códigos QR.
              </p>
              <p className="text-sm text-neutral-400 leading-relaxed font-light mb-6">
                El sistema evalúa reglas de negocio matemáticas para el cálculo de tolerancias, permitiendo 
                que estudiantes y ponentes tengan visibilidad analítica y transparente de los tiempos efectivos.
              </p>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-xs font-mono text-indigo-300 font-bold tracking-wider">
                  Proudly built with AI Assistance
                </span>
              </div>
            </div>

            {/* CONTACT & AUTHOR */}
            <div>
              <h3 className="text-lg font-mono text-white font-bold uppercase tracking-widest mb-6">Author & Contact</h3>
              <div className="space-y-6">
                
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="text-white font-bold text-lg mb-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>Josué Solano</h4>
                  <p className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-4">Software Architecture & Computer Engineering</p>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <a href="https://www.linkedin.com/in/josue-solano-dev" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors group">
                      <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/20 transition-all">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      </div>
                      linkedin.com/in/josue-solano-dev
                    </a>
                    <a href="https://github.com/Joxs10" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors group">
                      <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20 transition-all">
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      </div>
                      github.com/Joxs10
                    </a>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-600 font-mono text-center md:text-left">
                  &copy; {new Date().getFullYear()} ConferenciaURP. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* STYLES PARA LA ANIMACIÓN DE BORDE GIRATORIO */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-\\[spin_3s_linear_infinite\\] {
          animation: spin 3s linear infinite;
        }
      `}} />
    </div>
  );
}