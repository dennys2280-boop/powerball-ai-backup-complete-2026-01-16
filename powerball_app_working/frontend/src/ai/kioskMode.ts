const KEY="powerball_kiosk_mode_v1";
export function setKiosk(enabled:boolean){localStorage.setItem(KEY, enabled?"1":"0");}
export function isKiosk(){return localStorage.getItem(KEY)==="1";}
