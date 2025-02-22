import React, { useState } from 'react';
import './App.css';
import Chat from './Chat';
import ContactForm from './ContactForm';
import InfoPopup from './InfoPopup';
import VideoPopup from './VideoPopup';

function App() {
  const [hasError, setHasError] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [isSnaaks, setIsSnaaks] = useState(false);

  return (
    <div className="App">
      <header className="header">
        <h1>SoekmasjienKI</h1>
        <nav className="nav">
          <a 
            href="#gebruiksaanwysig" 
            onClick={(e) => { e.preventDefault(); setShowVideoPopup(true); }}
          >
            Gebruiksaanwysig
          </a>
          <a 
            href="#oor-soekmasjien" 
            onClick={(e) => { e.preventDefault(); setShowInfoPopup(true); }}
          >
            Oor SoekmasjienKI
          </a>
          {/*<a href="#ons">Ons</a>*/} 
          <a 
            href="#kontak-ons" 
            onClick={(e) => { e.preventDefault(); setShowContactForm(true); }}
          >
            Kontak Ons
          </a>
        </nav>
      </header>
      <main className="main-content">
        {hasError && <div className="error-banner">Something went wrong</div>}
        <Chat isSnaaks={isSnaaks} setHasError={setHasError} setIsSnaaks={setIsSnaaks} />
        {showContactForm && <ContactForm onClose={() => setShowContactForm(false)} />}
        {showInfoPopup && (
          <InfoPopup 
            text="SoekmasjienKI is 'n kunsmatige intelligensie (KI)-diens wat in staat is om natuurlike taalverwerkingsprestasies op 'n hoë vlak te lewer. Die diens bied 'n wye verskeidenheid dienste aan, waaronder die vermoë om tekste en gesprekke te genereer, te antwoord op vrae, om opdragte te volg, en om teks en spraak te vertaal. Dit kan ook gebruik word om komplekse take om te sit in die uitvoering van data-analise, dokumentbehandeling, en selfs die ontwikkeling van aanlyn-oplossings. Met sy uitgebreide vermoëns kan Soekmasjien 'n waardevolle hulpmiddel wees vir verskeie industrieë en organisasies wat op soek is na maniere om hul prosesse te optimaliseer en te verbeter. Byvoorbeeld, kan die diens gebruik word om kliëntediens-afdelings te ondersteun deur vinnig en akkuraat te antwoord op kliëntevrae en -navrae. Dit kan ook gebruik word om te help met die ontwikkeling van inhoud, deur middel van die skryf van artikels en blogposte, of selfs die generering van komplekse dokumente soos kontrakte of verslae. Verder kan Soekmasjien ook gebruik word om te help met die ontwikkeling van aanlyn-oplossings, soos chatbots en digitale assistente. Dit kan help om gesprekke met kliënte te lei, om te help met die beantwoording van vrae, of om te help met die bemarking van produkte of dienste. Met sy vermoë om te antwoord op natuurlike taalvrae en om opdragte te volg, kan Soekmasjien 'n belangrike hulpmiddel wees om kliënte te help om snel die informasie te kry wat hulle nodig het, en om hulle te help om maklik te navigeer deur 'n aanlyn-omgewing. In samenvatting is Soekmasjien 'n kragtige KI-diens wat 'n wye verskeidenheid dienste bied wat kan help om prosesse te optimaliseer en te verbeter, en wat kan help om kliënte te ondersteun en te bevorder. Dit bied 'n waardevolle hulpmiddel vir verskeie industrieë en organisasies wat op soek is na maniere om hul aanlyn-aanwesigheid te versterk en te bevorder"
            onClose={() => setShowInfoPopup(false)}
          />
        )}
        {showVideoPopup && (
          <VideoPopup 
            videoUrl="https://www.youtube.com/embed/wy_AbqXro18"
            onClose={() => setShowVideoPopup(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;