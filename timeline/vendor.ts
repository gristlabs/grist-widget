import moment from 'moment-timezone';
import 'moment/locale/en-gb';
import {registerIconLibrary} from '@shoelace-style/shoelace/dist/utilities/icon-library.js';
registerIconLibrary('default', {
  resolver: name => `./out/${name}.svg`
});
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
// Make sure we have monday as the first day of the week.
moment.locale('en-gb');