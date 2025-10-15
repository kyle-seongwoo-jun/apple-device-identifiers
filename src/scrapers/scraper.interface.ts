export interface DeviceDictionary {
  [id: string]: string;
}

export interface DeviceDictionaryWithDuplicates {
  [id: string]: string | string[];
}
