import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Tab, Card, Tabs, List, Select, MenuItem, ListItem, InputLabel, Typography, FormControl, ListItemText } from '@mui/material';
import BrokerService from '../../../../../../../Services/api-services/market-Type-Mana';
import type { TradingRulesData } from '../../view';
import type { BrokerAccount } from '../../../../../../../Services/api-services/market-Type-Mana';

const CardWrapper = ({ theme }: { theme: any }) => ({
  overflow: 'hidden',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    width: 210,
    height: 210,
    background: `linear-gradient(210.04deg, ${theme.palette.warning.dark} -50.94%, rgba(144, 202, 249, 0) 83.49%)`,
    borderRadius: '50%',
    top: -30,
    right: -180,
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    width: 210,
    height: 210,
    background: `linear-gradient(140.9deg, ${theme.palette.warning.dark} -14.02%, rgba(144, 202, 249, 0) 70.50%)`,
    borderRadius: '50%',
    top: -160,
    right: -130,
  },
});

interface MarketType {
  name: string;
  shortName: string;
}

interface TradingType {
  id: string;
  name: string;
}

interface TradingRule {
  key: string;
  value: string;
}

interface MyAccountsDetailsProps {
  onTradingRulesChange?: (data: TradingRulesData) => void;
}

export function MyAccountsDetails({ onTradingRulesChange }: MyAccountsDetailsProps) {
  const theme = useTheme();
  const [selectedMarketTypeId, setSelectedMarketTypeId] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState('');
  const [selectedSubbroker, setSelectedSubbroker] = useState('');
  const [marketTypes] = useState<MarketType[]>([
    { name: 'Stock Market', shortName: 'stockmarket' },
    { name: 'Cryptocurrency', shortName: 'cryptocurrency' },
    { name: 'Forex', shortName: 'forex' },
  ]);
  const [brokers, setBrokers] = useState<BrokerAccount[]>([]);
  const [subBrokers, setSubBrokers] = useState<BrokerAccount[]>([]);
  const [tradingTypes] = useState<TradingType[]>([
    { id: 'cash', name: 'Cash' },
    { id: 'future', name: 'Future' },
    { id: 'option', name: 'Option' },
  ]);
  const [selectedTradingType, setSelectedTradingType] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBrokerAccount, setSelectedBrokerAccount] = useState<BrokerAccount | null>(null);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);

  // Fetch brokers by market type
  const fetchBrokersByMarketType = async (marketType: string) => {
    setLoading(true);
    try {
      const response = await BrokerService.getBrokerDetails({ marketTypeId: marketType });
      const brokersData = response.data || [];
      setBrokers(Array.isArray(brokersData) ? brokersData : []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sub-brokers
  const fetchSubBrokers = async (marketTypeId: string, brokerId: string) => {
    setLoading(true);
    try {
      const response = await BrokerService.getSubBrokerDetails({ 
        marketTypeId, 
        brokerId 
      });
      const subBrokersData = response.data || [];
      setSubBrokers(Array.isArray(subBrokersData) ? subBrokersData : []);
    } catch (error) {
      console.error('Error fetching sub-brokers:', error);
      setSubBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trading rules
  const fetchTradingRules = async (subBrokerId: string, tradingType: string) => {
    try {
      const response = await BrokerService.getTradingRules({ 
        subBrokerId,
        tradingType 
      });
      const rulesData = response.data.data || [];
      setTradingRules(Array.isArray(rulesData) ? rulesData : []);
      return rulesData;
    } catch (error) {
      console.error('Error fetching trading rules:', error);
      setTradingRules([]);
      return null;
    }
  };

  const uniqueBrokers = Array.from(new Set(brokers.map((broker) => broker.brokerName)))
    .map((brokerName) => brokers.find((broker) => broker.brokerName === brokerName))
    .filter((broker): broker is BrokerAccount => broker !== undefined);

  const handleTabChange = (marketType: string) => {
    setSelectedMarketTypeId(marketType);
    setBrokers([]);
    setSubBrokers([]);
    setSelectedBrokerId('');
    setSelectedSubbroker('');
    setSelectedTradingType('');
    setSelectedBrokerAccount(null);
    setTradingRules([]);
    fetchBrokersByMarketType(marketType);
  };

  useEffect(() => {
    if (marketTypes.length > 0 && !selectedMarketTypeId) {
      setSelectedMarketTypeId(marketTypes[0].shortName);
      fetchBrokersByMarketType(marketTypes[0].shortName);
    }
  }, [marketTypes, selectedMarketTypeId]); 

  return (
    <div>
      <Card sx={{ ...CardWrapper({ theme }), height: '100%' }}>
        <Tabs value={selectedMarketTypeId}>
          {marketTypes.map((marketType) => (
            <Tab
              key={marketType.shortName}
              label={<span style={{ fontWeight: 'bold' }}>{marketType.shortName}</span>}
              value={marketType.shortName}
              onClick={() => handleTabChange(marketType.shortName)}
              sx={{ gap: 8 }}
            />
          ))}
        </Tabs>

        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          <FormControl fullWidth variant="filled" sx={{ minWidth: 200 }}>
            <InputLabel>Broker</InputLabel>
            <Select
              value={selectedBrokerId}
              onChange={(e) => {
                setSelectedBrokerId(e.target.value);
                setSubBrokers([]);
                setSelectedSubbroker('');
                setSelectedTradingType('');
                setTradingRules([]);
                fetchSubBrokers(selectedMarketTypeId, e.target.value);
              }}
              disabled={loading || brokers.length === 0}
            >
              <MenuItem value="">
                <em>Select Broker</em>
              </MenuItem>
              {uniqueBrokers.map((broker) => (
                <MenuItem key={broker._id} value={broker._id}>
                  {broker.brokerName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth variant="filled" sx={{ minWidth: 200 }}>
            <InputLabel>Sub-broker</InputLabel>
            <Select
              value={selectedSubbroker}
              onChange={(e) => {
                const selectedAccount = subBrokers.find((b) => b._id === e.target.value);
                if (selectedAccount) {
                  setSelectedSubbroker(e.target.value);
                  setSelectedBrokerAccount(selectedAccount);
                  setSelectedTradingType('future');
                  setTradingRules([]);
                }
              }}
              disabled={loading || subBrokers.length === 0 || !selectedBrokerId}
            >
              <MenuItem value="">
                <em>Select Sub-broker</em>
              </MenuItem>
              {subBrokers.map((broker) => (
                <MenuItem key={broker._id} value={broker._id}>
                  {broker.brokerAccountName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth variant="filled" sx={{ minWidth: 200 }}>
            <InputLabel>Trading Type</InputLabel>
            <Select
              value={selectedTradingType}
              onChange={(e) => {
                setSelectedTradingType(e.target.value);
                if (selectedBrokerId && selectedSubbroker) {
                  fetchTradingRules(
                    selectedSubbroker,
                    e.target.value
                  ).then((rules) => {
                    if (rules && onTradingRulesChange && selectedBrokerAccount) {
                      onTradingRulesChange({
                        brokerAccountName: selectedBrokerAccount.brokerAccountName,
                        marketTypeId: selectedMarketTypeId,
                        brokerId: selectedBrokerId,
                        cash: rules.cash,
                        option: rules.option,
                        future: rules.future,
                      });
                    }
                  });
                }
              }}
              disabled={loading || !selectedSubbroker}
            >
              <MenuItem value="">
                <em>Select Trading Type</em>
              </MenuItem>
              {tradingTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </Card>

      <Card sx={{ ...CardWrapper({ theme }), height: '100%', marginTop: 2 }}>
        {tradingRules.length > 0 ? (
          <div style={{ width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Trading Rules
            </Typography>
            <List>
              {tradingRules.map((rule, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={rule.key}
                    secondary={rule.value}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                  />
                </ListItem>
              ))}
            </List>
          </div>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No trading rules available. Please select a trading type.
          </Typography>
        )}
      </Card>
    </div>
  );
}
