declare module '*.geojson' {
  const value: import('@/types/site').StrandedSitesCollection
  export default value
}

export {} // allow direct import of types if needed
