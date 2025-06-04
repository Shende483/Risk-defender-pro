/* eslint-disable no-new */

import type { RefObject, MutableRefObject } from 'react';

import { useRef, useState, useEffect } from 'react';

import { Add, Brightness4 } from '@mui/icons-material';
import { Grid, Button, Typography } from '@mui/material';

import { initialSymbols } from './SymbolDefine';

declare global {
  interface Window {
    TradingView: any;
  }
}

let tvScriptLoadingPromise: Promise<void> | undefined;

export default function TradingviewChartAndData() {
  const onLoadScriptRef: MutableRefObject<(() => void) | null> = useRef(null);
  const cardRef: RefObject<HTMLDivElement> = useRef(null);
  const widgetRef = useRef<any>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);

  const [theme, setTheme] = useState<string>('dark');
  #const [currentSymbol, setCurrentSymbol] = useState<string>(initialSymbols[0]);
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null);
  #const [savedPrices, setSavedPrices] = useState<number[]>([]);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 850,
    height: 570,
  });
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number, y: number } | null>(null);

  // Handle adding price to saved list
  const handleAddPrice = () => {
    if (crosshairPrice) {
      setSavedPrices(prev => [...prev, crosshairPrice]);
    }
  };

  // Track mouse movements for crosshair
  const handleMouseMove = (e: MouseEvent) => {
    if (!widgetRef.current) return;

    try {
      const container = document.getElementById('tradingview_e5aee');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update crosshair position for button placement
      setCrosshairPosition({ x, y });

      // Get price at current position
      const chart = widgetRef.current.chart();
      if (chart) {
        const price = chart.priceFromCoordinate(y);
        if (price) {
          setCrosshairPrice(price);
        }
      }
    } catch (error) {
      console.error('Error tracking crosshair:', error);
    }
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (cardRef.current) {
        setDimensions({
          width: cardRef.current.clientWidth,
          height: cardRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.defer = true;
        script.type = 'text/javascript';
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => {
      if (onLoadScriptRef.current) {
        onLoadScriptRef.current();
      }
    }).catch(console.error);

    return () => {
      const container = document.getElementById('tradingview_e5aee');
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };

  });

  function createWidget() {
    const widgetContainer = document.getElementById('tradingview_e5aee');
    if (!widgetContainer || !window.TradingView) return;
    // eslint-disable-next-line new-cap
    widgetRef.current = new window.TradingView.widget({
      width: dimensions.width,
      height: dimensions.height,
      symbol: `BINANCE:${currentSymbol}.P`,
      interval: 'M',
      timezone: 'Etc/UTC',
      theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      watchlist: initialSymbols.map((sym) => `BINANCE:${sym}.P`),
      details: true,
      hotlist: true,
      calendar: true,
      show_popup_button: true,
      container_id: 'tradingview_e5aee',
    });

    widgetRef.current.onChartReady(() => {
      widgetContainer.addEventListener('mousemove', handleMouseMove);
    });
  }

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (


    <Grid
      container
      className="tradingview-widget-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Theme toggle button */}
      <Button
        variant="text"
        size="small"
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: 4,
          right: 180,
          zIndex: 10,
          backgroundColor: 'transparent',
          color: theme === 'dark' ? 'white' : 'black',
          padding: '5px 10px',
          fontSize: '13px',
          boxShadow: 'none',
          outline: 'none',
          border: 'none',
          minWidth: 'auto',
        }}
      >
        <Brightness4 fontSize="small" />
      </Button>

      {/* Plus button near crosshair */}
      {crosshairPosition && crosshairPrice && (
        <Button
          ref={plusButtonRef}
          variant="contained"
          size="small"
          onClick={handleAddPrice}
          startIcon={<Add />}
          sx={{
            position: 'absolute',
            left: `${crosshairPosition.x + 10}px`,
            top: `${crosshairPosition.y - 15}px`,
            zIndex: 10,
            minWidth: 'auto',
            padding: '2px 6px',
            backgroundColor: theme === 'dark' ? '#1976d2' : '#90caf9',
            '&:hover': {
              backgroundColor: theme === 'dark' ? '#1565c0' : '#64b5f6',
            },
          }}
        >
          {crosshairPrice.toFixed(2)}
        </Button>
      )}

      <Grid item xs={12} md={12} style={{ width: '100%', height: '100%' }}>
        <div
          id="tradingview_e5aee"
          style={{ width: '100%', height: '100%', position: 'relative' }}
        />
      </Grid>

      <Typography fontSize="23px" fontWeight="bold" color="#00b0ff"
        component="a"
        href="https://www.tradingview.com/"
        rel="noopener noreferrer"
        target="_blank"
        sx={{
          color: '#00b0ff',
          fontSize: '16px !important',
          textDecoration: 'none',
          marginLeft: '270px',
        }}
      >
        Track all markets on TradingView
      </Typography>
    </Grid>

  );

}
