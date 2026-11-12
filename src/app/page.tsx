import Link from 'next/link'

export default function Home() {
  return <div className="container">
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span /> For curious minds & everyday collectors</p><h1>Find your next<br /><em>favourite thing.</em></h1><p className="hero-description">Thoughtful little discoveries for your shelf, your desk, or someone you know by heart.</p><div className="hero-actions"><Link className="button primary" href="/shop">Explore the shop<span aria-hidden="true">→</span></Link><Link className="text-link" href="/shop#gift-finder">Find a gift with AI →</Link></div><div className="hero-note"><span aria-hidden="true">✦</span> A small shop. A world of possibilities.</div></div>
      <div className="hero-art" aria-label="A playful collection of building blocks and a toy car" role="img"><div className="art-orbit" /><div className="art-label">A GOOD FIND<br /><strong>starts with curiosity.</strong></div><div className="art-block block-one" /><div className="art-block block-two" /><div className="toy-car"><i /><i /></div><span className="art-star star-one">✳</span><span className="art-star star-two">✦</span><div className="art-caption"><span>THE EVERYDAY COLLECTION</span><span>01 — 03</span></div></div>
    </section>
    <section className="intro-strip" aria-label="Our approach"><p>Less endless scrolling.<br /><strong>More “that’s the one.”</strong></p><div><span className="strip-icon" aria-hidden="true">01</span><span>Curated with<br /><strong>curiosity</strong></span></div><div><span className="strip-icon" aria-hidden="true">02</span><span>Made to<br /><strong>be enjoyed</strong></span></div><div><span className="strip-icon" aria-hidden="true">03</span><span>A little<br /><strong>more personal</strong></span></div></section>
    <section className="welcome-banner"><div><p className="eyebrow">Your corner of Erogine</p><h2>Good things begin<br />with a little hello.</h2></div><div><p>Create an account to keep your details and future orders together.</p><Link href="/register" className="button secondary">Join Erogine<span aria-hidden="true">→</span></Link></div></section>
  </div>
}
