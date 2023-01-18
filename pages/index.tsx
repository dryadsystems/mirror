import { useEffect, useMemo, useRef, useState, CSSProperties } from 'react';
//import { useDebouncedState, useDebouncedValue } from '@mantine/hooks';
import useSWRImmutable from 'swr';
import Image from 'next/image';
import Animation from '../components/bg_animation';
import { Input } from '../components/input';
import { Navbar } from '../components/navbar';
import { ExpandButton, Menu } from '../components/expand_button';
import { ArtistPane } from '../components/panes/artists';

const leftMenus: Menu[] = ['history']; //, 'params'];
const rightMenus: Menu[] = ['artists'];

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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function History({ sentLog }: { sentLog: { prompt: string; id: number }[] }) {
  const sentLogList = sentLog.map((item) => <li key={item.id}>{item.prompt}</li>);
  return (
    <div className="sidebar">
      <h1>History</h1>
      <div className="artist-lists">{<ul style={{ color: '#a79369' }}>{sentLogList}</ul>}</div>
    </div>
  );
}

function CrossFadedImages({ fadeState }: { fadeState: FadeState }) {
  const style: CSSProperties = {
    transition: 'opacity 1s linear',
    position: 'absolute',
    // top: "5%",
    // left: "5%",
  };
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
          />
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
          />
        </div>
      </div>
      <div style={{ zIndex: 0, position: 'absolute', width: '100%', height: '100%' }}>
        <Animation />
      </div>
    </div>
  );
}

export default function HomePage() {
  const inputEl = useRef(null);
  const [prompt, setPrompt] = useState('');
  const [socketState, setSocketState] = useState<'generating' | 'ready'>('ready');

  const [fadeState, setFadeState] = useState<FadeState>({
    topVisible: false,
    bottomVisible: true,
    topImage: transparent,
    bottomImage: transparent,
    id: null,
  });
  const [sentLog, updateSentLog] = useState<{ prompt: string; id: number }[]>([]);
  const [lastSent, setLastSent] = useState<Sent>({ prompt: null, time: null });
  const [latency, setLatency] = useState<Latency | null>(null);

  const [expanded, setExpanded] = useState<Menu>('none');
  const [artist, setArtist] = useState<string | null>(null);

  const { data, mutate } = useSWRImmutable('https://metamirror.fly.dev/get_url', (url) =>
    fetch(url).then((r) => r.json())
  );

  useEffect(() => {
    if (data?.status !== 'ready') {
      setTimeout(() => mutate(), 500);
    }
  }, [data, mutate]);

  const ws = useMemo(() => {
    console.log(data);
    if (typeof window === 'undefined' || data?.status !== 'ready') {
      return null;
    }
    // const window_url =
    //   (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws';
    // return new WebSocket(process.env.NEXT_PUBLIC_MIRRORFRAME_URL ?? window_url);
    return new WebSocket(data.url.replace('http', 'ws') + '/ws');
  }, [data]);

  useEffect(() => {
    if (ws) {
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
          const parsed = JSON.parse(data);
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
          setSocketState('ready');
          console.timeEnd('generate');
          console.log(
            'last sent',
            lastSent,
            'actual sent time',
            parsed.id,
            'now',
            Date.now(),
            'e2e latency:',
            Date.now() - parsed.id,
            'gen:',
            parsed.gen_time
          );
          setLatency({
            gen: parsed.gen_time,
            net: Date.now() - parsed.id - parsed.gen_time,
          });
        }
      });
      setInterval(function () {
        if (ws.readyState === 1) {
          const message = 'ping ' + (Date.now() % 86400000);
          ws.send(message);
        }
      }, 2000);
      // setInterval(() => onPromptChange(prompt), 2000);
    }
  }, [ws]);

  /* When artist changes, fire onPromptChange */
  useEffect(() => {
    console.log('artist changed, firing', prompt);
    onPromptChange(prompt);
  }, [artist]);

  useEffect(() => {
    console.log('latency changed, firing', prompt);
    onPromptChange(prompt);
  }, [latency]);

  function onPromptChange(prompt: string) {
    const _prompt = prompt; //inputEl.current?.value ?? prompt;
    if (_prompt.length == 0) {
      return;
    }
    setPrompt(_prompt);
    const promptWithArtist = artist ? `${_prompt} by ${artist}` : _prompt;

    console.log('Prompt changed to', promptWithArtist, 'last prompt was', lastSent);
    if (promptWithArtist !== lastSent.prompt && socketState === 'ready') {
      console.log(ws);
      if (ws && ws.readyState === 1) {
        setSocketState('generating');
        setLastSent((x) => {
          return { prompt: promptWithArtist, time: Date.now() };
        });
        const params = { prompt: promptWithArtist, id: Date.now() };
        updateSentLog((log) => [...log, params]);
        console.log('Sending', params);
        console.time('generate');
        ws.send(JSON.stringify(params));
      }
    } else if (socketState !== 'ready') {
      console.log('ignoring, prompt is same');
    }
  }

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
            direction="right"
          />
        ))}
      </div>
      <div className="buttons" style={{ left: 0 }}>
        {leftMenus.map((menu) => (
          <ExpandButton
            key={menu}
            menu={menu}
            setExpanded={setExpanded}
            expanded={expanded}
            direction="left"
          />
        ))}
      </div>
      <CrossFadedImages fadeState={fadeState} />
      <Input
        _ref={inputEl}
        setDebouncedPrompt={onPromptChange}
        loading={socketState === 'generating'}
      />
      <div style={{ color: '#a79369' }}>
        {data?.message ?? 'Requesting worker URL...'}
        {latency && `Generation latency: ${latency.gen}ms. Network latency: ${latency.net}`}
      </div>
    </div>
  );

  const leftSideBar = (
    <div
      style={{
        width: expanded === 'params' || expanded === 'history' ? '20%' : '0%',
        transition: 'width 0.5s',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    >
      {expanded === 'history' && <History sentLog={sentLog} />}
    </div>
  );

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
        {leftSideBar}
        {mainPage}
        {rightSideBar}
      </div>
    </div>
  );
}
