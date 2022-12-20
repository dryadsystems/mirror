import { useEffect, useMemo, useState, CSSProperties } from 'react';
import { useDebouncedState, useDebouncedValue } from '@mantine/hooks';
import Image from 'next/image';
import Animation from '../components/bg_animation';
import { Input } from '../components/input';
import { Navbar } from '../components/navbar';
import { ExpandButton, Menu } from '../components/expand_button';
import { ArtistPane } from '../components/panes/artists';

//const leftMenus: Menu[] = ['history', 'params'];
const rightMenus: Menu[] = ['artists', 'history'];

interface FadeState {
  topVisible: boolean;
  bottomVisible: boolean;
  topImage: string;
  bottomImage: string;
  id: number | null;
}

interface Sent {
  prompt: string | null;
  time: number | null;
}
interface Latency {
  gen: number;
  net: number;
}

const transparent =
  'data:image/svg;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiPjwvc3ZnPgo=';

function History({ sentLog }: { sentLog: string[] }) {
  const sentLogList = sentLog.map((prompt) => <li key={prompt}>{prompt}</li>);
  return (
    <div className="sidebar">
      <h1>History</h1>
      <div>{<ul style={{ color: '#a79369' }}>{sentLogList}</ul>}</div>
    </div>
  );
}

function CrossFadedImages({ fadeState }: { fadeState: FadeState }) {
  const style: CSSProperties = {
    transition: 'opacity 1s linear',
    position: 'absolute',
    // top: "5%",
    // left: "5%",
    // width: "512px",
    // height: "512px",
  };
  console.log('rendering faded');
  return (
    <div className="img-wrapper" style={{ position: 'relative', backgroundColor: 'black' }}>
       <div style={{ zIndex: 2, position: 'absolute', width: '100%', height: '100%' }}>
        <div style={style}>
          <Image
            key="imoge"
            id="imoge"
            alt="imoge"
            src={fadeState.topImage}
            className={fadeState.topVisible ? 'visible' : 'invisible'}
            height="512px"
            width="512px"
          ></Image>
        </div>
        <div style={style}>
          <Image
            key="imoge"
            id="imoge2"
            alt="imoge"
            src={fadeState.bottomImage}
            className={fadeState.bottomVisible ? 'visible' : 'invisible'}
            height="512px"
            width="512px"
          ></Image>
        </div>
      </div>
      <div style={{ zIndex: 0, position: 'absolute', width: '100%', height: '100%' }}>
        <Animation />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  // const [lastSubmitted, setLastSubmitted] = useState('');
  const [socketState, setSocketState] = useState<'generating' | 'ready'>('ready');

  // const [visibleState, setVisibleState] = useState(false);
  // const [hideAnimationPromise, setHideAnimationPromise] = useState<Promise<void> | null>(null);

  const [fadeState, setFadeState] = useState<FadeState>({
    topVisible: false,
    bottomVisible: true,
    topImage: transparent,
    bottomImage: transparent,
    id: null,
  });
  const [lastSent, setLastSent] = useState<Sent>({ prompt: null, time: null });
  const [latency, setLatency] = useState<Latency | null>(null);

  // const [nextSubmit, setNextSubmitTime] = useState(0);
  // const [submitTime, setSubmitTime] = useState(0);
  // const [responseTime, setResponseTime] = useState(0);

  const [expanded, setExpanded] = useState<Menu>('none');
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [artist, setArtist] = useState<string | null>(null);

  const isBrowser = typeof window !== 'undefined';

  const ws = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const window_url =
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';
    return new WebSocket(process.env.NEXT_PUBLIC_MIRRORFRAME_URL ?? window_url);
  }, []);

  useEffect(() => {
    if (ws) {
      // console.log('adding');
      // ws.addEventListener('open', (event) => {
      //   console.log('ws opened');
      //   getAndSendPrompt();
      // });
      ws.addEventListener('message', async ({ data }) => {
        if (data.substring(0, 4) === 'pong') {
          // if (Math.random() < 0.1) {
          //   // sample 10% of pings
          //   var elapsed_ms = (Date.now() % 86400000) - parseInt(data.substring(5), 10);
          //   console.log('ws RTT ' + elapsed_ms + ' ms\n');
          // }
        } else {
          let parsed = JSON.parse(data);
          setFadeState((fadeState) => {
            console.log('fadeState is', fadeState);
            const imageUpdate = fadeState.topVisible
              ? { bottomImage: parsed.image }
              : { topImage: parsed.image };
            return {
              ...fadeState,
              ...imageUpdate,
              topVisible: !fadeState.topVisible,
              bottomVisible: !fadeState.bottomVisible,
            };
          });
          // this will be misleading bc setFadeState is enqueued but not rendered yet
          // console.log('now fadeState is', fadeState);

          // await showImage(`url(${parsed.image})`);

          setSocketState('ready');
          console.timeEnd('generate');
          console.log(
            'last sent',
            lastSent,
            //lastSent?.time,
            parsed.id,
            'now',
            Date.now(),
            'e2e latency:',
            //Date.now() - lastSent?.time ?? 0,
            Date.now() - parsed.id,
            'gen:',
            parsed.gen_time
          );
          setLatency({
            gen: parsed.gen_time,
            net: Date.now() - parsed.id - parsed.gen_time,
          });
          // getAndSendPrompt();
        }
      });
      setInterval(function () {
        if (ws.readyState === 1) {
          var message = 'ping ' + (Date.now() % 86400000);
          ws.send(message);
        }
      }, 2000);
      setInterval(() => onPromptChange(prompt), 2000);
    }
  }, [ws]);

  /* When artist changes, fire onPromptChange */
  useEffect(() => {
    onPromptChange(prompt);
  }, [artist]);

  // function getAndSendPrompt() {
  //   console.log('getting and sending');
  //   let interval = setInterval(function () {
  //     // console.log(ws)
  //     const promptWithArtist = artist ? `${prompt} by ${artist}` : prompt;
  //     if (prompt && promptWithArtist !== lastSent.prompt) {
  //       console.log(ws, socketState);
  //       if (socketState === 'ready' && ws.readyState === 1) {
  //         clearInterval(interval);
  //         setLastSent({ prompt: promptWithArtist, time: Date.now() });
  //         setSocketState('generating');
  //         const params = JSON.stringify({ prompt: promptWithArtist });
  //         console.log('Sending', params);
  //         ws.send(params);
  //       }
  //     }
  //   }, 100); // maybe longer? maybe this is inefficient?
  // }
  const [sentLog, updateSentLog] = useState<string[]>([]);

  function onPromptChange(prompt: string) {
    if (prompt.length == 0) {
      // hideImage();
      return;
    }
    setPrompt(prompt);
    const promptWithArtist = artist ? `${prompt} by ${artist}` : prompt;

    console.log('Prompt changed to', promptWithArtist);
    if (promptWithArtist !== lastSent.prompt && socketState === 'ready') {
      console.log(ws);
      if (ws && ws.readyState === 1) {
        setSocketState('generating');
        setLastSent((x) => {console.log("setting last sent"); return { prompt: promptWithArtist, time: Date.now() }});
        updateSentLog((log) => [...log, promptWithArtist]);
        const params = JSON.stringify({ prompt: promptWithArtist, id: Date.now() });
        console.log('Sending', params);
        // setTimeout(() => {
        //   hideImage();
        // }, 300);
        console.time('generate');
        console.log('updated last sent');
        ws.send(params);
      }
    }
  }

  const sentLogList = sentLog.map((prompt) => <li key={prompt}>{prompt}</li>);
  console.log('possibly rendering main');
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
      <CrossFadedImages fadeState={fadeState} />
      <Input setDebouncedPrompt={onPromptChange} loading={socketState == 'generating'} />
      <div style={{ color: '#a79369' }}>
        {latency && `Generation latency: ${latency.gen}ms. Network latency: ${latency.net}`}
      </div>
      {<ul style={{ color: '#a79369' }}>{sentLogList}</ul>}
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
      {expanded === 'history' && <History sentLog={sentLog} />}
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
