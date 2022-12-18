import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { useDebouncedState, useDebouncedValue } from '@mantine/hooks';
// import Animation from '../components/bg_animation';
// import { Grid, staggerAnimate } from '../components/transition_grid';
import Image from 'next/image';
import { Input } from '../components/input';
import { Navbar } from '../components/navbar';
import { ExpandButton, Menu } from '../components/expand_button';
import { ArtistPane } from '../components/panes/artists';

//const leftMenus: Menu[] = ['history', 'params'];
const rightMenus: Menu[] = ['artists'];

interface FadeState {
  topVisible: boolean;
  bottomVisible: boolean;
  topImage: string;
  bottomImage: string;
}

function openSocket() {
  if (typeof window === 'undefined') {
    return null;
  }
  const window_url =
    (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';
  return new WebSocket(process.env.NEXT_PUBLIC_MIRRORFRAME_URL ?? window_url);
}
const transparent =
  'data:image/svg;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiPjwvc3ZnPgo=';
export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [lastSubmitted, setLastSubmitted] = useState('');
  const [socketState, setSocketState] = useState<'generating' | 'ready'>('ready');

  const [visibleState, setVisibleState] = useState(false);
  const [hideAnimationPromise, setHideAnimationPromise] = useState<Promise<void> | null>(null);

  const [fadeState, setFadeState] = useState<FadeState>({
    topVisible: true,
    bottomVisible: false,
    topImage: transparent,
    bottomImage: transparent,
  });

  const [nextSubmit, setNextSubmitTime] = useState(0);
  const [submitTime, setSubmitTime] = useState(0);
  const [responseTime, setResponseTime] = useState(0);

  const [expanded, setExpanded] = useState<Menu>('none');
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [artist, setArtist] = useState<string | null>(null);

  const isBrowser = typeof window !== 'undefined';

  const ws = useMemo(openSocket, []);

  const style: CSSProperties = {
    transition: 'opacity 1s linear',
    position: 'absolute',
    // top: "5%",
    // left: "5%",
    // width: "512px",
    // height: "512px",
  };

  // function hideImage() {
  //   setVisibleState(false);
  //   staggerAnimate(false);

  //   setHideAnimationPromise(
  //     new Promise((resolve) => {
  //       setTimeout(() => {
  //         resolve();
  //       }, 150);
  //     })
  //   );
  // }

  // async function showImage(image: string) {
  //   if (hideAnimationPromise) {
  //     console.log('waiting....');
  //     await hideAnimationPromise;
  //   }
  //   await hideAnimationPromise;
  //   if (isBrowser) {
  //     document.documentElement.style.setProperty('--image', image);
  //   }
  //   setVisibleState(true);
  //   staggerAnimate(true);
  // }

  useEffect(() => {
    if (ws) {
      ws.addEventListener('message', async ({ data }) => {
        if (data.substring(0, 4) === 'pong') {
          if (Math.random() < 0.1) { // sample 10% of pings
            var elapsed_ms = (Date.now() % 86400000) - parseInt(data.substring(5), 10);
            console.log('ws RTT ' + elapsed_ms + ' ms\n');
          }
        } else {
          let parsed = JSON.parse(data);
          console.log('fadeState is', fadeState);
          const imageUpdate = fadeState.topVisible
            ? { bottomImage: parsed.image }
            : { topImage: parsed.image };
          setFadeState({
            ...fadeState,
            ...imageUpdate,
            topVisible: !fadeState.topVisible,
            bottomVisible: !fadeState.bottomVisible,
          });
          // this will be misleading bc setFadeState is enqueued but not rendered yet
          // console.log('now fadeState is', fadeState);

          // await showImage(`url(${parsed.image})`);

          setSocketState('ready');
          setResponseTime(Date.now());
          console.log('Response time', responseTime - submitTime);
          console.log(parsed.gen_time);
          setSubmitTime(nextSubmit);
        }
      });
      setInterval(function () {
        if (ws.readyState === 1) {
          var message = 'ping ' + (Date.now() % 86400000);
          ws.send(message);
        }
      }, 2000);
    }
  }, [ws]);

  /* When artist changes, fire onPromptChange */
  useEffect(() => {
    onPromptChange(prompt);
  }, [artist]);

  function onPromptChange(prompt: string) {
    if (prompt.length == 0) {
      // hideImage();
      return;
    }

    setPrompt(prompt);

    const promptWithArtist = artist ? `${prompt} by ${artist}` : prompt;

    console.log('Prompt changed to', promptWithArtist);
    if (promptWithArtist !== lastSubmitted && socketState === 'ready') {
      console.log(ws);
      if (ws && ws.readyState === 1) {
        setSocketState('generating');
        console.log('Sending', JSON.stringify({ prompt: promptWithArtist, ddim_steps: 25 }));
        ws.send(JSON.stringify({ prompt: promptWithArtist }));
        // setTimeout(() => {
        //   hideImage();
        // }, 300);
        setNextSubmitTime(Date.now());
        setLastSubmitted(promptWithArtist);
      }
    }
  }

  console.log("possibly rendering main")
  const mainPage = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        position: 'relative',
        width: expanded === 'none' ? '100%' : '70%',
        transition: 'width 0.5s',
      }}
    >
      <div className="buttons" style={{ right: 0 }}>
        {rightMenus.map((menu) => (
          <ExpandButton
            key={menu}
            menu={menu}
            setExpanded={setExpanded}
            expanded={expanded}
            direction={'right'}
          />
        ))}
      </div>
      {/*
      <div className="buttons" style={{ left: 0 }}>
        {leftMenus.map((menu) => (
          <ExpandButton
            key={menu}
            menu={menu}
            setExpanded={setExpanded}
            expanded={expanded}
            direction={'left'}
          />
        ))}
      </div>*/}
      <div className="img-wrapper" style={{ position: 'relative', backgroundColor: 'black' }}>
        {/*
        <div style={{ zIndex: 2, position: 'absolute', width: '100%', height: '100%' }}>
          <Grid />
        </div>
        <div style={{ zIndex: 0, position: 'absolute', width: '100%', height: '100%' }}>
          <Animation />
        </div>*/}
        <div style={style}>
          <Image
            id="imoge"
            alt="imoge"
            src={fadeState.topImage}
            style={{ opacity: fadeState.topVisible ? 1 : 0 }}
            height="512px"
            width="512px"
          ></Image>
        </div>
        <div style={style}>
          <Image
            id="imoge2"
            alt="imoge"
            src={fadeState.bottomImage}
            style={{ opacity: fadeState.bottomVisible ? 1 : 0 }}
            height="512px"
            width="512px"
          ></Image>
        </div>
        <br />
      </div>
      <Input setDebouncedPrompt={onPromptChange} loading={socketState == 'generating'} />
    </div>
  );

  // const leftSideBar = (
  //   <div
  //     style={{
  //       width: expanded === 'params' || expanded === 'history' ? '30%' : '0%',
  //       transition: 'width 0.5s',
  //       backgroundColor: 'rgba(0,0,0,0.5)',
  //     }}
  //   ></div>
  // );

  const rightSideBar = (
    <div
      style={{
        width: expanded === 'artists' || expanded === 'styles' ? '30%' : '0%',
        transition: 'width 0.5s',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      {expanded === 'artists' && <ArtistPane artist={artist} setArtist={setArtist} />}
    </div>
  );

  return (
    <div>
      <Navbar />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        {/*leftSideBar*/}
        {mainPage}
        {rightSideBar}
      </div>
    </div>
  );
}
