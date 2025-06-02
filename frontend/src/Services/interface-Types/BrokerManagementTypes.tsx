export interface BrokerManagement {
  _id: string;
  name: string;
  status: string;
  marketTypeId: string;
  createdDate: string;
  modifiedDate: string;
}

export interface BrokerManagmentdetails {
  _id: string;
  name: string;
  status: string;
  marketTypeId: string;
  createdDate: string;
  modifiedDate: string;
}

export interface tradingType {
  _id: string;
  brokerName: string;
  brokerAccountName: string;
}
