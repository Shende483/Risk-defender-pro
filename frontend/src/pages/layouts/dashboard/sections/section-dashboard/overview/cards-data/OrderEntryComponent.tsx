import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Alert,
  Button,
  Select,
  Slider,
  styled,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  CardContent,
  ButtonGroup,
  FormControl,
} from '@mui/material';

import MarketTypeService from '../../../../../../../Services/api-services/MarketTypeService';
import OrderPlacementService from '../../../../../../../Services/api-services/OrderPlacementService';

import type { OrderPlacementype } from '../../../../../../../Services/interface-Types/OrderplacementTypes';

const StyledButtonGroup = styled(ButtonGroup)({
  width: '100%',
  marginBottom: '8px',
  '& .MuiButton-root': {
    width: '50%',
    padding: '6px',
    color: 'black',
  },
});

interface TradingRule {
  key: string;
  value: string;
}

interface TradingRulesData {
  brokerAccountName: string;
  cash: TradingRule[];
  option: TradingRule[];
  future: TradingRule[];
}

interface MyDefinedRulesProps {
  tradingRules?: TradingRulesData;
  activeTab: string;
  selectedMarketTypeId: string;
}

interface MarketType {
  _id: string;
  name: string;
}

interface StatusMessage {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  field?: string;
}

export default function OrderEntryComponentconst({ tradingRules, activeTab, selectedMarketTypeId }: MyDefinedRulesProps) {
  const [symbol, setSymbol] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  #const [marketTypes, setMarketTypes] = useState<MarketType[]>([]);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showSnackbar, setShowSnackbar] = useState<boolean>(false);

  const getRuleFieldsForTab = () => {
    if (!tradingRules) return [];
    const segment = tradingRules[activeTab as keyof TradingRulesData];
    if (!Array.isArray(segment)) return [];
    return segment.map((rule) => rule.key);
  };
  console.log('getRuleFieldsForTab', getRuleFieldsForTab());
  const findRuleValue = (key: string): string => {
    if (!tradingRules) return 'Not defined';
    const segment = tradingRules[activeTab as keyof TradingRulesData];
    if (!Array.isArray(segment)) return 'Not defined';

    const rule = segment.find((r) => r.key === key);
    return rule ? rule.value : 'Not defined';
  };

  const MaxLeverage = findRuleValue('MaxLeverage').replace('X', '');
  const MaxRiskEntry = findRuleValue('MaxRiskEntry').replace('%', '');
  const EntrySide = findRuleValue('EntrySide').toUpperCase();
  const MarginTypes = findRuleValue('MarginTypes').toUpperCase();

  const isIsolated = MarginTypes === 'ISOLATED' || MarginTypes === 'ISOLATED, CROSS';
  const isCross = MarginTypes === 'CROSS' || MarginTypes === 'ISOLATED, CROSS';
  const isSell = EntrySide === 'SELL' || EntrySide === 'BUY, SELL';
  const isBuy = EntrySide === 'BUY' || EntrySide === 'BUY, SELL'

  useEffect(() => {
    const fetchMarketTypes = async () => {
      const response = await MarketTypeService.getAllActiveMarketTypes();
      setMarketTypes(Array.from(response.data.values()));
      console.log('API Response:', response.data.keys);
    };
    fetchMarketTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const orderDetails: OrderPlacementype = {
        marketTypeId: selectedMarketTypeId,
        orderType: activeTab,
        orderPlacingType: market,
        entryPrice: Number(entryPrice) || 0,
        symbol,
        allowedDirection: [EntrySide],
        marginTypes: [MarginTypes],
        maxLeverage: Number(MaxLeverage) || 0,
        maxRiskPercentage: Number(MaxRiskEntry) || 0,
        stopLoss: Number(stopLoss) || 0,
        targetPrice: Number(targetPrice) || 0,
        status: "active",
      };

      const response = await OrderPlacementService.CreateOrder(orderDetails);
      console.log('Order Template Created Successfully:', response);
      setStatusMessage({
        text: response.message || 'Order Template Created Successfully',
        type: 'success',
      });
      setShowSnackbar(true);
    } catch (error: any) {
      console.error('Order Template failed:', error);
      setStatusMessage({
        text: error.message || 'Invalid credentials. Please try again.',
        type: 'error',
      });
      setShowSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <Card sx={{ m: 2, top: 4, bgcolor: '#ede7f6' }}>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={statusMessage?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {statusMessage?.text}
        </Alert>
      </Snackbar>

      <CardContent>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <Select
            displayEmpty
            value={symbol}
            onChange={(event) => setSymbol(event.target.value as string)}
            size="small"
            sx={{ '& .MuiSelect-select': { color: 'black' } }}
          >
            <MenuItem value="">Select Symbol</MenuItem>
            <MenuItem value="BTC">BTC</MenuItem>
            <MenuItem value="ETH">ETH</MenuItem>
          </Select>
        </FormControl>

        <StyledButtonGroup variant="outlined">
          <Button
            sx={{
              backgroundColor: isSell ? 'red' : 'inherit',
              cursor: isSell ? 'pointer' : 'not-allowed',
              color: 'black',
              '&:hover': {
                backgroundColor: isSell ? 'darkred' : 'inherit',
              },
            }}
            size="small"
          >
            SELL(SHORT)
          </Button>
          <Button
            sx={{
              backgroundColor: isBuy ? 'green' : 'inherit',
              cursor: isBuy ? 'pointer' : 'not-allowed',
              color: 'black',
              '&:hover': {
                backgroundColor: isBuy ? 'darkgreen' : 'inherit',
              },
            }}
            size="small"
          >
            BUY(LONG)
          </Button>
        </StyledButtonGroup>

        <StyledButtonGroup variant="outlined" sx={{ mb: 1 }}>
          <Button
            sx={{
              backgroundColor: isIsolated ? 'purple' : 'inherit',
              cursor: isIsolated ? 'pointer' : 'not-allowed',
              color: 'black',
              '&:hover': {
                backgroundColor: isIsolated ? 'purple' : 'darkpurple',
              },
            }}
            size="small"
          >
            ISOLATED
          </Button>
          <Button
            sx={{
              backgroundColor: isCross ? 'purple' : 'inherit',
              cursor: isCross ? 'pointer' : 'not-allowed',
              color: 'black',
              '&:hover': {
                backgroundColor: isCross ? 'purple' : 'darkpurple',
              },
            }}
            size="small"
          >
            CROSSED
          </Button>
        </StyledButtonGroup>

        <Box sx={{ mb: 1 }}>
          <Typography fontSize="0.8rem" color="black">
            LEVERAGE(MAX 20x):
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Slider
              value={Number(MaxLeverage) || 0}
              valueLabelDisplay="off"
              max={20}
              size="small"
              sx={{ color: '#0d6efd', flexGrow: 1 }}
            />
            <Typography sx={{ ml: 1, fontWeight: 'bold' }}>{Number(MaxLeverage) || 0}x</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography fontSize="0.8rem" color="black">
            MAX RISK: %
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Slider
              value={Number(MaxRiskEntry) || 0}
              valueLabelDisplay="off"
              max={100}
              size="small"
              sx={{ color: '#0d6efd', flexGrow: 1 }}
            />
            <Typography sx={{ ml: 1, fontWeight: 'bold' }}>{Number(MaxRiskEntry) || 0}%</Typography>
          </Box>
        </Box>

        <FormControl fullWidth sx={{ mb: 1 }}>
          <Select
            displayEmpty
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            size="small"
            sx={{ '& .MuiSelect-select': { color: 'black' } }}
          >
            <MenuItem value="">Select Market</MenuItem>
            <MenuItem value="Stop">STOP MARKET</MenuItem>
            <MenuItem value="Market">MARKET</MenuItem>
          </Select>
        </FormControl>
        {market === 'Stop' && (
          <TextField
            fullWidth
            placeholder="Enter Entry Price"
            sx={{ mb: 1, '& .MuiInputBase-input': { color: 'black' } }}
            size="small"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
          />
        )}
        <TextField
          fullWidth
          placeholder="Enter StopLoss Price"
          sx={{ mb: 1, '& .MuiInputBase-input': { color: 'black' } }}
          size="small"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
        />
        <TextField
          fullWidth
          placeholder="Enter Target Price"
          sx={{ mb: 1, '& .MuiInputBase-input': { color: 'black' } }}
          size="small"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
        />

        <Button variant="contained" fullWidth onClick={handleSubmit}>SUBMIT ORDER</Button>
      </CardContent>
    </Card>
  );
};
