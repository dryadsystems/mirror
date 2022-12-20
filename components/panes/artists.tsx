import Image from 'next/image';
import { useState } from 'react';

const artistList = [
  'Mucha, Alphonse',
  'Moebius',
  'Bussiere, Gaston',
  'Kinkade, Thomas',
  'Frazetta, Frank',
  'Hopper, Edward',
  'Caravaggio',
  'Delville, Jean',
  'Klimt, Gustav',
  'Dore, Gustave',
  'Beksinski, Zdzislaw',
  'Dali, Salvador',
  'Giraud, Jean',
  'Hildebrandt, Tim',
  'Mead, Syd',
  'Elvgren, Gil',
  'Bacon, Francis',
  'da Vinci, Leonardo',
  'Swynnerton, Annie',
  'Haeckel, Ernst',
  'Bosch, Hieronymus',
  'Rivera, Diego',
  'Giger, H. R.',
  'Berkey, John',
  'Bierstadt, Albert',
];

export function ArtistBox({
  name,
  active,
  setActive,
}: {
  name: string;
  active: string | null;
  setActive: (name: string | null) => void;
}) {
  /* Show an image from the artist, along with the name below it */
  /* This should all be in a button */

  const imageUrl = `https://fqbyocakhbhchhfvnkcu.supabase.co/storage/v1/object/public/artist-images/${name}.png`;

  // Name format is "Last, First" change it to "First Last"
  const reformattedName = name.split(', ').reverse().join(' ');

  function clickFunc() {
    if (active === reformattedName) {
      setActive(null);
    } else {
      setActive(reformattedName);
    }
  }

  return (
    <button
      className={active === name ? 'artist-box active' : 'artist-box'}
      style={{ position: 'relative' }}
      onClick={clickFunc}
    >
      <div className="artist-box-overlay" />
      <div style={{ position: 'absolute', zIndex: 1, top: 0 }}>
        <img src={imageUrl} width="100%" />
        {/*<Image src={imageUrl} layout="responsive" width={512} height={512} />*/}
      </div>
      <p>{reformattedName}</p>
    </button>
  );
}

export function ArtistPane({
  artist,
  setArtist,
}: {
  artist: string | null;
  setArtist: (artist: string | null) => void;
}) {
  return (
    <div className="sidebar">
      <h1>Artists</h1>
      <div className="artist-lists">
        {/* Alternate between two columns */}
        <div className="artist-list">
          {artistList
            .filter((_, i) => i % 2 === 0)
            .map((name) => (
              <ArtistBox key={name} name={name} active={artist} setActive={setArtist} />
            ))}
        </div>
        <div className="artist-list">
          {artistList
            .filter((_, i) => i % 2 === 1)
            .map((name) => (
              <ArtistBox key={name} name={name} active={artist} setActive={setArtist} />
            ))}
        </div>
      </div>
    </div>
  );
}
