import { ReactNode } from "react";
import "./Layout.css"

function Layout(props: { children: ReactNode }) {
  return (
    <div>
      <header>
        <nav>
          <div id="nav-bar">
            <div id="nav-bar-left">
              <button id="project-info-link" onClick={() => { }}>
                Info <br></br><span style={{ fontSize: "12px" }}>(Ver. 0.1 alpha)</span>
              </button>
            </div>
            <div id="nav-bar-center"></div>
            <div id="nav-bar-right">
              <div id="audio">
                <div id="audio_player"></div>
                <div id="audio_switch"></div>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <div id="page">
        <div id="application-wrapper">
          <div id="application">
            <div id="application-content" >
              {props.children}
            </div>
            <div id="bottom-bar">
              <div id="bottom-left"></div>
              <div id="bottom-center"></div>
              <div id="bottom-right"></div>
            </div>
          </div>
        </div>
      </div>
      <footer>
        <div id="footer-bar">
          <div id="footer-bar-left">
            <div id="copyright">Copyright <a href="http://www.hyperweb2.com" target="_blank" rel="noreferrer">HyperWeb2 (Software) 2015</a> , AMI Informatica S.a.s. (Media) 1998 </div>
          </div>
          <div id="footer-bar-center"></div>
          <div id="footer-bar-right">
            Supporta lo sviluppo
            <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
              <input type="hidden" name="cmd" value="_s-xclick"></input>
              <input type="image" src="https://www.paypalobjects.com/it_IT/IT/i/btn/btn_donate_SM.gif" name="submit" alt="PayPal - Il metodo rapido, affidabile e innovativo per pagare e farsi pagare."></input>
              <img alt="" src="https://www.paypalobjects.com/it_IT/i/scr/pixel.gif" width="1" height="1"></img>
            </form>
          </div>
        </div>
      </footer>
    </div >
  );
}

export default Layout;
