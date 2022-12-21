import { useDebouncedState } from '@mantine/hooks';
import { useEffect } from 'react';

export function Input({
  setDebouncedPrompt,
  loading,
  _ref,
}: {
  setDebouncedPrompt: (value: string) => void;
  loading: boolean;
  _ref: any;
}) {
  const [prompt, setPrompt] = useDebouncedState('', 100);

  useEffect(() => {
    setDebouncedPrompt(prompt);
  }, [prompt]);

  return (
    <textarea
      onChange={(event) => setPrompt(event.target.value)}
      className={loading ? 'input-field loading' : 'input-field'}
      ref={_ref}
    />
  );
}
