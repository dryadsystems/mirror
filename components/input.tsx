import { useDebouncedState } from '@mantine/hooks';
import { useEffect } from 'react';

export function Input({
  setDebouncedPrompt,
  loading,
}: {
  setDebouncedPrompt: (value: string) => void;
  loading: boolean;
}) {
  const [prompt, setPrompt] = useDebouncedState('', 5);

  useEffect(() => {
    setDebouncedPrompt(prompt);
  }, [prompt]);

  return (
    <textarea
      onChange={(event) => setPrompt(event.target.value)}
      className={loading ? 'input-field loading' : 'input-field'}
    />
  );
}
