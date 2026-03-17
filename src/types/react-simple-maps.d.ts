declare module 'react-simple-maps' {
  import { ComponentType, CSSProperties, ReactNode } from 'react'

  interface ProjectionConfig {
    scale?: number
    center?: [number, number]
    rotate?: [number, number, number]
    parallels?: [number, number]
  }

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    width?: number
    height?: number
    style?: CSSProperties
    children?: ReactNode
  }

  interface GeographiesChildProps {
    geographies: any[]
    outline: any
    borders: any
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>
    children: (data: GeographiesChildProps) => ReactNode
  }

  interface GeographyStyleProps {
    default?: CSSProperties
    hover?: CSSProperties
    pressed?: CSSProperties
  }

  interface GeographyProps {
    geography: any
    key?: string
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: GeographyStyleProps
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseMove?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const ZoomableGroup: ComponentType<any>
  export const Marker: ComponentType<any>
  export const Line: ComponentType<any>
  export const Graticule: ComponentType<any>
  export const Sphere: ComponentType<any>
}
