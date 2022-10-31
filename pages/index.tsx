import { useEffect, useMemo, useState } from 'react';
import { useDebouncedState, useDebouncedValue } from '@mantine/hooks';
import Animation from '../components/bg_animation';
import { Grid, staggerAnimate } from '../components/transition_grid';
import { Input } from '../components/input';
import { Navbar } from '../components/navbar';
import { ExpandButton, Menu } from '../components/expand_button';
import { ArtistPane } from '../components/panes/artists';

const URL = process.env.MIRRORFRAME_URL ?? 'wss://otgmvl9loyr63q-64410b9e-8080.proxy.runpod.io/ws';

const leftMenus: Menu[] = ['history', 'params'];
const rightMenus: Menu[] = ['artists'];

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [lastSubmitted, setLastSubmitted] = useState('');
  const [socketState, setSocketState] = useState<'generating' | 'ready'>('ready');

  const [nextSubmit, setNextSubmitTime] = useState(0);
  const [submitTime, setSubmitTime] = useState(0);
  const [responseTime, setResponseTime] = useState(0);

  const [visibleState, setVisibleState] = useState(false);
  const [expanded, setExpanded] = useState<Menu>('none');

  const [hideAnimationPromise, setHideAnimationPromise] = useState<Promise<void> | null>(null);

  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);

  const [artist, setArtist] = useState<string | null>(null);

  const isBrowser = typeof window !== 'undefined';

  const ws = useMemo(() => (isBrowser ? new WebSocket(URL) : null), []);

  function hideImage() {
    setVisibleState(false);
    staggerAnimate(false);

    setHideAnimationPromise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1500);
      })
    );
  }

  async function showImage(image: string) {
    if (hideAnimationPromise) {
      console.log('waiting....');
      await hideAnimationPromise;
    }
    await hideAnimationPromise;
    if (isBrowser) {
      document.documentElement.style.setProperty('--image', image);
    }
    setVisibleState(true);
    staggerAnimate(true);
  }

  useEffect(() => {
    if (ws) {
      ws.addEventListener('message', async ({ data }) => {
        await showImage(`url(${data})`);
        setSocketState('ready');
        setResponseTime(Date.now());
        console.log('Response time', responseTime - submitTime);

        setSubmitTime(nextSubmit);
      });
    }
  }, [ws]);

  /* When artist changes, fire onPromptChange */
  useEffect(() => {
    onPromptChange(prompt);
  }, [artist]);

  function onPromptChange(prompt: string) {
    if (prompt.length == 0) {
      hideImage();
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
        setTimeout(() => {
          hideImage();
        }, 1100);
        setNextSubmitTime(Date.now());
        setLastSubmitted(promptWithArtist);
      }
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
            direction={'right'}
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
            direction={'left'}
          />
        ))}
      </div>
      <div className="img-wrapper" style={{ position: 'relative', backgroundColor: 'black' }}>
        <div style={{ zIndex: 2, position: 'absolute', width: '100%', height: '100%' }}>
          <Grid />
        </div>
        <div style={{ zIndex: 0, position: 'absolute', width: '100%', height: '100%' }}>
          <Animation />
        </div>
      </div>
      <Input setDebouncedPrompt={onPromptChange} loading={socketState == 'generating'} />
    </div>
  );

  const leftSideBar = (
    <div
      style={{
        width: expanded === 'params' || expanded === 'history' ? '30%' : '0%',
        transition: 'width 0.5s',
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
    ></div>
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
