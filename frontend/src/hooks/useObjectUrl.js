import { useEffect, useMemo } from 'react'

// A preview URL for a File/Blob (e.g. a picture before it's uploaded), cleaned up automatically
export function useObjectUrl(blob) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : ''), [blob])
  useEffect(() => () => url && URL.revokeObjectURL(url), [url])
  return url
}
