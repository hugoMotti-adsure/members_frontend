'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, MapPin } from 'lucide-react'
import { useGeoDistribution, useActiveSessions } from '../hooks/use-analytics'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface MapMarker {
  coordinates: [number, number]
  city: string
  country: string
  count: number
}

export function WorldMap() {
  const { data: geoData, isLoading: geoLoading } = useGeoDistribution()
  const { data: sessions } = useActiveSessions()
  const [markers, setMarkers] = useState<MapMarker[]>([])

  // Criar marcadores a partir das sessões ativas
  useEffect(() => {
    if (sessions) {
      const activeMarkers = sessions
        .filter(s => s.latitude && s.longitude)
        .map(s => ({
          coordinates: [s.longitude!, s.latitude!] as [number, number],
          city: s.city || 'Desconhecida',
          country: s.country || '',
          count: 1,
        }))
      setMarkers(activeMarkers)
    }
  }, [sessions])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-emerald-500" />
          Mapa de Usuários Online
          {markers.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {markers.length} localização(ões)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[2/1] bg-gradient-to-b from-slate-900/50 to-slate-950/80 rounded-lg overflow-hidden">
          {geoLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 100,
                center: [0, 30],
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#1e293b"
                        stroke="#334155"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: '#334155', outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {/* Marcadores de usuários online */}
                {markers.map((marker, index) => (
                  <Marker key={index} coordinates={marker.coordinates}>
                    <motion.g
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {/* Pulse effect */}
                      <circle
                        r={8}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={2}
                        opacity={0.5}
                      >
                        <animate
                          attributeName="r"
                          from="4"
                          to="12"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.6"
                          to="0"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      {/* Main dot */}
                      <circle
                        r={4}
                        fill="#10b981"
                        stroke="#fff"
                        strokeWidth={1}
                        style={{ cursor: 'pointer' }}
                      />
                    </motion.g>
                    <title>{`${marker.city}, ${marker.country}`}</title>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-muted-foreground">Usuário online</span>
            </div>
          </div>
        </div>

        {/* Top Countries */}
        {geoData?.countries && geoData.countries.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            {geoData.countries.slice(0, 5).map((country, index) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-lg">
                  {getFlagEmoji(country.code)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{country.name}</p>
                  <p className="text-xs text-muted-foreground">{country.count} visitante(s)</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper para converter código de país em emoji de bandeira
function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '🌍'
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
