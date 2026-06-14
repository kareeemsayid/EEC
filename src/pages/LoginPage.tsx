<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>EEC · Employee Exit Command Center · Concentrix</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;width:100%;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif}

body{display:flex;background:#07080f}

/* ═══════════════════════════════════════════
   LEFT PANEL — wide hero banner
═══════════════════════════════════════════ */
.left{
  position:relative;
  flex:0 0 58%;
  min-height:100vh;
  overflow:hidden;
  background:#07080f;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding:0 60px;
}

/* Deep space base */
.left-bg{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 90% 70% at 10% 20%, rgba(90,30,200,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 90% 85%, rgba(255,90,40,0.22) 0%, transparent 50%),
    radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,140,200,0.08) 0%, transparent 60%),
    #07080f;
  z-index:0;
}

/* Grid */
.grid-lines{
  position:absolute;inset:0;z-index:1;pointer-events:none;
  background-image:
    linear-gradient(rgba(255,100,50,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,100,50,0.05) 1px, transparent 1px);
  background-size:52px 52px;
  mask-image:radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%);
}

canvas#particles{position:absolute;inset:0;z-index:2;width:100%;height:100%}

/* Vertical accent line */
.left::after{
  content:'';
  position:absolute;right:0;top:0;bottom:0;width:1px;
  background:linear-gradient(180deg,transparent 0%,rgba(255,90,40,0.4) 30%,rgba(123,47,255,0.5) 70%,transparent 100%);
  z-index:20;
}

.left-content{position:relative;z-index:10}

/* Top status bar */
.status-bar{
  display:flex;align-items:center;gap:10px;
  margin-bottom:48px;
}
.status-dot{
  width:8px;height:8px;border-radius:50%;
  background:#00e676;
  box-shadow:0 0 10px #00e676,0 0 20px rgba(0,230,118,0.4);
  animation:secPulse 2s ease-in-out infinite;
}
@keyframes secPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}}
.status-text{
  font-size:11px;color:rgba(0,230,118,0.75);
  letter-spacing:2px;text-transform:uppercase;font-weight:600;
}
.status-divider{width:1px;height:14px;background:rgba(255,255,255,0.1)}
.status-corp{font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:2px;text-transform:uppercase}

/* Big orbital emblem */
.emblem-wrap{
  position:relative;
  width:120px;height:120px;
  margin-bottom:36px;
}
.emblem-ring{
  position:absolute;border-radius:50%;border:1.5px solid;
  top:50%;left:50%;transform:translate(-50%,-50%);
}
.r1{width:120px;height:120px;border-color:rgba(123,47,255,0.2);animation:spinR 18s linear infinite}
.r2{width:90px;height:90px;border-color:rgba(255,90,40,0.25);animation:spinL 11s linear infinite;border-style:dashed}
.r3{width:62px;height:62px;border-color:rgba(0,163,204,0.3);animation:spinR 7s linear infinite}
@keyframes spinR{to{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes spinL{to{transform:translate(-50%,-50%) rotate(-360deg)}}

.orb-dot{position:absolute;border-radius:50%;top:50%;left:50%}
.od1{
  width:8px;height:8px;background:#ff6b35;
  box-shadow:0 0 10px #ff6b35,0 0 20px rgba(255,107,53,0.5);
  margin:-4px 0 0 -4px;
  animation:od1a 5s linear infinite;
}
.od2{
  width:6px;height:6px;background:#7b2fff;
  box-shadow:0 0 8px #7b2fff;
  margin:-3px 0 0 -3px;
  animation:od2a 8s linear infinite reverse;
}
.od3{
  width:5px;height:5px;background:#00a3cc;
  box-shadow:0 0 7px #00a3cc;
  margin:-2.5px 0 0 -2.5px;
  animation:od3a 12s linear infinite;
}
@keyframes od1a{from{transform:rotate(0deg) translateX(52px) rotate(0deg)}to{transform:rotate(360deg) translateX(52px) rotate(-360deg)}}
@keyframes od2a{from{transform:rotate(0deg) translateX(38px) rotate(0deg)}to{transform:rotate(360deg) translateX(38px) rotate(-360deg)}}
@keyframes od3a{from{transform:rotate(0deg) translateX(24px) rotate(0deg)}to{transform:rotate(360deg) translateX(24px) rotate(-360deg)}}

.emblem-core{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:52px;height:52px;
  background:linear-gradient(135deg,#7b2fff,#ff6b35);
  border-radius:13px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 0 30px rgba(123,47,255,0.5),0 0 60px rgba(255,107,53,0.2);
  animation:coreBreath 3s ease-in-out infinite;
  z-index:5;
}
@keyframes coreBreath{
  0%,100%{box-shadow:0 0 30px rgba(123,47,255,0.5),0 0 60px rgba(255,107,53,0.2)}
  50%{box-shadow:0 0 50px rgba(123,47,255,0.7),0 0 100px rgba(255,107,53,0.35)}
}
.core-eec{color:#fff;font-weight:900;font-size:13px;letter-spacing:1.5px;line-height:1}
.core-sub{color:rgba(255,255,255,0.6);font-size:6.5px;letter-spacing:2.5px;margin-top:2px;font-weight:500}

/* Hero headline */
.hero-eyebrow{
  font-size:11px;color:rgba(255,107,53,0.8);
  letter-spacing:4px;text-transform:uppercase;font-weight:700;
  margin-bottom:14px;
  display:flex;align-items:center;gap:10px;
}
.eyebrow-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,107,53,0.5),transparent)}

.hero-title{
  font-size:clamp(2rem,3.5vw,3.2rem);
  font-weight:900;
  line-height:1.08;
  letter-spacing:-1.5px;
  margin-bottom:16px;
}
.ht-white{color:#ffffff}
.ht-grad{
  background:linear-gradient(120deg,#c084fc 0%,#ff6b35 55%,#fb923c 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}

.hero-sub{
  font-size:14px;color:rgba(255,255,255,0.4);
  line-height:1.7;max-width:400px;
  margin-bottom:40px;
  letter-spacing:0.2px;
}

/* Stat pills row */
.stats-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:44px}
.stat-pill{
  padding:8px 16px;border-radius:10px;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);
  display:flex;flex-direction:column;gap:2px;
}
.stat-val{font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px}
.stat-lbl{font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase}

/* Feature list */
.features{display:flex;flex-direction:column;gap:10px}
.feat{
  display:flex;align-items:center;gap:12px;
  padding:10px 14px;border-radius:10px;
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.06);
  opacity:0;
  animation:featIn 0.5s ease forwards;
}
@keyframes featIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
.feat-icon{
  width:32px;height:32px;border-radius:8px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:15px;
}
.fi-purple{background:rgba(123,47,255,0.15);border:1px solid rgba(123,47,255,0.25)}
.fi-orange{background:rgba(255,107,53,0.12);border:1px solid rgba(255,107,53,0.2)}
.fi-teal{background:rgba(0,163,204,0.1);border:1px solid rgba(0,163,204,0.2)}
.fi-green{background:rgba(0,200,100,0.1);border:1px solid rgba(0,200,100,0.18)}
.feat-text{font-size:12.5px;color:rgba(255,255,255,0.65);letter-spacing:0.1px}

/* Bottom brand strip */
.brand-strip{
  position:absolute;bottom:28px;left:60px;right:40px;
  display:flex;align-items:center;justify-content:space-between;
  z-index:10;
}
.cnx-wordmark{
  font-size:11px;color:rgba(255,255,255,0.2);
  letter-spacing:3px;text-transform:uppercase;font-weight:700;
}
.cnx-line{height:1px;width:80px;background:linear-gradient(90deg,rgba(255,107,53,0.3),transparent)}

/* ═══════════════════════════════════════════
   RIGHT PANEL — login form
═══════════════════════════════════════════ */
.right{
  flex:1;
  background:#0b0d1a;
  display:flex;align-items:center;justify-content:center;
  padding:40px 48px;
  position:relative;
  overflow:hidden;
}

/* Subtle right bg glow */
.right::before{
  content:'';position:absolute;
  width:400px;height:400px;border-radius:50%;
  background:radial-gradient(circle,rgba(123,47,255,0.08) 0%,transparent 70%);
  top:-100px;right:-100px;pointer-events:none;
}
.right::after{
  content:'';position:absolute;
  width:300px;height:300px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,107,53,0.06) 0%,transparent 70%);
  bottom:-80px;left:-80px;pointer-events:none;
}

.form-card{
  width:100%;max-width:360px;
  animation:cardSlideIn 0.8s cubic-bezier(0.22,1,0.36,1) forwards;
  position:relative;z-index:5;
}
@keyframes cardSlideIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}

/* Animated border card */
.card-border{
  border-radius:20px;padding:2px;
  background:linear-gradient(135deg,rgba(123,47,255,0.5),rgba(255,107,53,0.4),rgba(0,163,204,0.35));
  background-size:200% 200%;
  animation:borderAnim 5s linear infinite;
}
@keyframes borderAnim{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.card-body{
  background:#0e1020;
  border-radius:18px;
  padding:32px 28px;
  position:relative;overflow:hidden;
}

/* Top shimmer line */
.card-body::before{
  content:'';
  position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,#7b2fff,#ff6b35,transparent);
  animation:topShimmer 3s ease-in-out infinite;
}
@keyframes topShimmer{0%,100%{opacity:0.3;transform:scaleX(0.4)}50%{opacity:1;transform:scaleX(1)}}

/* Corner brackets */
.brk{position:absolute;width:18px;height:18px;border-color:rgba(255,107,53,0.5);border-style:solid;border-width:0}
.brk-tl{top:10px;left:10px;border-top-width:2px;border-left-width:2px;border-radius:4px 0 0 0}
.brk-tr{top:10px;right:10px;border-top-width:2px;border-right-width:2px;border-radius:0 4px 0 0}
.brk-bl{bottom:10px;left:10px;border-bottom-width:2px;border-left-width:2px;border-radius:0 0 0 4px}
.brk-br{bottom:10px;right:10px;border-bottom-width:2px;border-right-width:2px;border-radius:0 0 4px 0}

/* Form header */
.form-header{text-align:center;margin-bottom:24px}
.form-title{
  font-size:22px;font-weight:800;
  background:linear-gradient(120deg,#fff 0%,#d8b4fe 50%,#fca37c 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  letter-spacing:-0.5px;margin-bottom:4px;
}
.form-sub{font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:2px;text-transform:uppercase}

/* Access badges */
.access-badges{
  display:flex;gap:6px;justify-content:center;flex-wrap:wrap;
  margin-bottom:22px;
}
.abadge{
  font-size:9px;font-weight:700;
  padding:3px 9px;border-radius:8px;
  letter-spacing:1px;text-transform:uppercase;
}
.ab-purple{background:rgba(123,47,255,0.18);color:rgba(200,170,255,0.9);border:1px solid rgba(123,47,255,0.3)}
.ab-orange{background:rgba(255,107,53,0.15);color:rgba(255,180,130,0.9);border:1px solid rgba(255,107,53,0.3)}
.ab-teal{background:rgba(0,163,204,0.12);color:rgba(130,210,240,0.9);border:1px solid rgba(0,163,204,0.25)}

/* Disclaimer */
.disclaimer{
  border-radius:10px;
  background:rgba(0,163,204,0.05);
  border:1px solid rgba(0,163,204,0.15);
  padding:12px 14px;
  margin-bottom:20px;
  position:relative;overflow:hidden;
}
.disclaimer::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
  background:linear-gradient(180deg,#7b2fff,#00a3cc);
}
.disc-head{
  font-size:9.5px;font-weight:700;color:rgba(160,210,255,0.85);
  text-transform:uppercase;letter-spacing:1.5px;
  margin-bottom:6px;display:flex;align-items:center;gap:6px;
}
.disc-lock{
  width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center;
  font-size:11px;
}
.disc-body{font-size:10.5px;color:rgba(255,255,255,0.32);line-height:1.6}

/* Divider */
.divider{
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,107,53,0.2),rgba(123,47,255,0.2),transparent);
  margin:18px 0;
}

/* Sign-in button */
.btn-signin{
  width:100%;padding:14px;border-radius:12px;
  border:none;cursor:pointer;
  font-size:14px;font-weight:700;letter-spacing:0.2px;
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,#fff 0%,#ede9fe 50%,#fff5f0 100%);
  color:#1a0a2e;
  transition:transform 0.25s ease,box-shadow 0.25s ease;
  box-shadow:0 4px 24px rgba(123,47,255,0.25),0 2px 8px rgba(0,0,0,0.4);
  display:flex;align-items:center;justify-content:center;gap:10px;
  margin-bottom:14px;
}
.btn-signin:hover:not(:disabled){
  transform:translateY(-2px);
  box-shadow:0 8px 36px rgba(123,47,255,0.45),0 4px 16px rgba(0,0,0,0.4);
}
.btn-signin:active:not(:disabled){transform:translateY(0)}
.btn-signin:disabled{opacity:0.65;cursor:not-allowed}

.btn-shimmer{
  position:absolute;inset:0;
  background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,0.55) 50%,transparent 80%);
  transform:translateX(-100%);
}
.btn-signin:hover:not(:disabled) .btn-shimmer{animation:shimmer 0.65s ease forwards}
@keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}

.ms-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:17px;height:17px;flex-shrink:0}
.ms-grid span{display:block;border-radius:1px}
.mf{background:#f25022}.mg{background:#7fba00}.mb{background:#00a4ef}.my{background:#ffb900}

.spinner{
  width:17px;height:17px;
  border:2.5px solid rgba(30,10,60,0.2);
  border-top-color:#4c1d95;
  border-radius:50%;
  animation:spin 0.7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

/* Security strip */
.sec-strip{
  display:flex;align-items:center;justify-content:center;gap:7px;
  padding:6px 12px;border-radius:8px;
  background:rgba(0,230,118,0.04);
  border:1px solid rgba(0,230,118,0.1);
}
.sec-led{
  width:6px;height:6px;border-radius:50%;background:#00e676;
  box-shadow:0 0 8px #00e676;animation:secPulse 2s ease-in-out infinite;
}
.sec-label{font-size:9.5px;color:rgba(0,230,118,0.65);letter-spacing:1.5px;text-transform:uppercase;font-weight:600}

/* Footer */
.form-footer{text-align:center;font-size:9.5px;color:rgba(255,255,255,0.15);margin-top:16px;letter-spacing:1.5px;text-transform:uppercase}

/* ═══ Loading overlay ═══ */
#loading-overlay{
  display:none;position:fixed;inset:0;background:rgba(7,8,15,0.92);
  z-index:999;align-items:center;justify-content:center;flex-direction:column;gap:20px;
}
#loading-overlay.active{display:flex}
.load-ring{
  width:60px;height:60px;border-radius:50%;
  border:3px solid rgba(123,47,255,0.15);
  border-top-color:#7b2fff;
  border-right-color:#ff6b35;
  animation:spin 1s linear infinite;
}
.load-text{font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:2.5px;text-transform:uppercase}

/* ═══ Responsive ═══ */
@media(max-width:900px){
  body{flex-direction:column;overflow:auto}
  .left{flex:none;min-height:55vh;padding:40px 32px}
  .right{padding:32px 24px}
}
</style>
</head>
<body>

<!-- LEFT PANEL -->
<div class="left">
  <div class="left-bg"></div>
  <div class="grid-lines"></div>
  <canvas id="particles"></canvas>

  <div class="left-content">
    <!-- Status bar -->
    <div class="status-bar">
      <div class="status-dot"></div>
      <span class="status-text">System Operational</span>
      <div class="status-divider"></div>
      <span class="status-corp">Concentrix · PS Division</span>
    </div>

    <!-- Orbital emblem -->
    <div class="emblem-wrap">
      <div class="emblem-ring r1"></div>
      <div class="emblem-ring r2"></div>
      <div class="emblem-ring r3"></div>
      <div class="orb-dot od1"></div>
      <div class="orb-dot od2"></div>
      <div class="orb-dot od3"></div>
      <div class="emblem-core">
        <span class="core-eec">EEC</span>
        <span class="core-sub">CNX · PS</span>
      </div>
    </div>

    <!-- Hero headline -->
    <div class="hero-eyebrow">
      Employee Exit Command Center
      <div class="eyebrow-line"></div>
    </div>

    <h1 class="hero-title">
      <span class="ht-white">Smarter exits,<br/></span>
      <span class="ht-grad">stronger teams.</span>
    </h1>

    <p class="hero-sub">
      The unified platform for Concentrix trainers to track attrition,
      manage exit workflows, and drive People Solutions intelligence — in real time.
    </p>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-pill">
        <span class="stat-val">360°</span>
        <span class="stat-lbl">Case Visibility</span>
      </div>
      <div class="stat-pill">
        <span class="stat-val">Auto</span>
        <span class="stat-lbl">Email Threads</span>
      </div>
      <div class="stat-pill">
        <span class="stat-val">Live</span>
        <span class="stat-lbl">Attrition Tracking</span>
      </div>
    </div>

    <!-- Feature list -->
    <div class="features">
      <div class="feat fi-purple-w" style="animation-delay:0.2s">
        <div class="feat-icon fi-purple">📊</div>
        <span class="feat-text">Real-time attrition case tracking &amp; analytics dashboard</span>
      </div>
      <div class="feat" style="animation-delay:0.35s">
        <div class="feat-icon fi-orange">🔗</div>
        <span class="feat-text">SharePoint &amp; Power Automate workflow integration</span>
      </div>
      <div class="feat" style="animation-delay:0.5s">
        <div class="feat-icon fi-teal">✉️</div>
        <span class="feat-text">Automated email thread management &amp; audit trail</span>
      </div>
      <div class="feat" style="animation-delay:0.65s">
        <div class="feat-icon fi-green">👥</div>
        <span class="feat-text">People Solutions intelligent workflow engine</span>
      </div>
    </div>
  </div>

  <!-- Bottom brand strip -->
  <div class="brand-strip">
    <span class="cnx-wordmark">Concentrix Corporation</span>
    <div class="cnx-line"></div>
  </div>
</div>

<!-- RIGHT PANEL -->
<div class="right">
  <div class="form-card">
    <div class="card-border">
      <div class="card-body">
        <div class="brk brk-tl"></div>
        <div class="brk brk-tr"></div>
        <div class="brk brk-bl"></div>
        <div class="brk brk-br"></div>

        <div class="form-header">
          <div class="form-title">Trainer Sign-In</div>
          <div class="form-sub">Secure · Azure AD SSO</div>
        </div>

        <!-- Access badges -->
        <div class="access-badges">
          <span class="abadge ab-purple">Internal Use Only</span>
          <span class="abadge ab-orange">Trainers</span>
          <span class="abadge ab-teal">PS · People Solutions</span>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <div class="disc-head">
            <span class="disc-lock">🔐</span>
            Restricted Access
          </div>
          <div class="disc-body">
            Authorized Concentrix trainers and PS personnel only. All sessions
            are monitored and audited. Unauthorized access is strictly
            prohibited under Concentrix security policy.
          </div>
        </div>

        <div class="divider"></div>

        <!-- Sign-in button -->
        <button class="btn-signin" id="loginBtn" onclick="handleLogin()">
          <span class="btn-shimmer"></span>
          <div class="ms-grid" aria-hidden="true">
            <span class="mf"></span><span class="mg"></span>
            <span class="mb"></span><span class="my"></span>
          </div>
          Sign in with Microsoft
        </button>

        <!-- Security -->
        <div class="sec-strip">
          <div class="sec-led"></div>
          <span class="sec-label">TLS 1.3 · Azure AD SSO · Encrypted</span>
        </div>

        <div class="form-footer">© 2025 Concentrix · All Rights Reserved</div>
      </div>
    </div>
  </div>
</div>

<!-- Loading overlay -->
<div id="loading-overlay">
  <div class="load-ring"></div>
  <div class="load-text">Authenticating with Microsoft…</div>
</div>

<script>
/* ─── Particle canvas ─── */
(function(){
  var canvas = document.getElementById('particles');
  var ctx = canvas.getContext('2d');
  var particles = [];
  var N = 80;
  var animId;

  function resize(){
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resize();
  window.addEventListener('resize', function(){resize();});

  for(var i=0;i<N;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      vx:(Math.random()-0.5)*0.35,
      vy:(Math.random()-0.5)*0.35,
      r:Math.random()*1.6+0.4,
      a:Math.random()*0.45+0.15
    });
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(var i=0;i<particles.length;i++){
      for(var j=i+1;j<particles.length;j++){
        var dx=particles[i].x-particles[j].x;
        var dy=particles[i].y-particles[j].y;
        var d=Math.sqrt(dx*dx+dy*dy);
        if(d<110){
          ctx.beginPath();
          ctx.strokeStyle='rgba(255,107,53,'+(0.1*(1-d/110))+')';
          ctx.lineWidth=0.5;
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.stroke();
        }
      }
    }
    for(var k=0;k<particles.length;k++){
      var p=particles[k];
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(255,140,80,'+p.a+')';
      ctx.fill();
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>canvas.width)p.vx*=-1;
      if(p.y<0||p.y>canvas.height)p.vy*=-1;
    }
    animId=requestAnimationFrame(draw);
  }
  draw();
})();

/* ─── Login handler ─── */
function handleLogin(){
  var btn = document.getElementById('loginBtn');
  var overlay = document.getElementById('loading-overlay');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Connecting…';
  overlay.classList.add('active');

  /* Replace with real MSAL/OAuth redirect in production */
  setTimeout(function(){
    overlay.classList.remove('active');
    btn.disabled = false;
    btn.innerHTML = '<div class="ms-grid" aria-hidden="true"><span class="mf"></span><span class="mg"></span><span class="mb"></span><span class="my"></span></div>Sign in with Microsoft';
  }, 2800);
}
</script>
</body>
</html>
