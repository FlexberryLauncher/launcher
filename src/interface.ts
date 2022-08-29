export interface KeyableObject {
   [key: string]: any;
}

export interface WizardInterface {
   appearance: KeyableObject;
   version: string;
   type: string;
}
