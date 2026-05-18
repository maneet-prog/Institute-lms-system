import { InputHTMLAttributes, useMemo } from "react";
import clsx from "clsx";

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

const COUNTRY_CODES = [
  { code: "+91", label: "IN (+91)" },
  { code: "+1", label: "US/CA (+1)" },
  { code: "+7", label: "RU/KZ (+7)" },
  { code: "+20", label: "EG (+20)" },
  { code: "+27", label: "ZA (+27)" },
  { code: "+30", label: "GR (+30)" },
  { code: "+31", label: "NL (+31)" },
  { code: "+32", label: "BE (+32)" },
  { code: "+33", label: "FR (+33)" },
  { code: "+34", label: "ES (+34)" },
  { code: "+36", label: "HU (+36)" },
  { code: "+39", label: "IT (+39)" },
  { code: "+40", label: "RO (+40)" },
  { code: "+41", label: "CH (+41)" },
  { code: "+43", label: "AT (+43)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+45", label: "DK (+45)" },
  { code: "+46", label: "SE (+46)" },
  { code: "+47", label: "NO (+47)" },
  { code: "+48", label: "PL (+48)" },
  { code: "+49", label: "DE (+49)" },
  { code: "+51", label: "PE (+51)" },
  { code: "+52", label: "MX (+52)" },
  { code: "+53", label: "CU (+53)" },
  { code: "+54", label: "AR (+54)" },
  { code: "+55", label: "BR (+55)" },
  { code: "+56", label: "CL (+56)" },
  { code: "+57", label: "CO (+57)" },
  { code: "+58", label: "VE (+58)" },
  { code: "+60", label: "MY (+60)" },
  { code: "+61", label: "AU (+61)" },
  { code: "+62", label: "ID (+62)" },
  { code: "+63", label: "PH (+63)" },
  { code: "+64", label: "NZ (+64)" },
  { code: "+65", label: "SG (+65)" },
  { code: "+66", label: "TH (+66)" },
  { code: "+81", label: "JP (+81)" },
  { code: "+82", label: "KR (+82)" },
  { code: "+84", label: "VN (+84)" },
  { code: "+86", label: "CN (+86)" },
  { code: "+90", label: "TR (+90)" },
  { code: "+92", label: "PK (+92)" },
  { code: "+93", label: "AF (+93)" },
  { code: "+94", label: "LK (+94)" },
  { code: "+95", label: "MM (+95)" },
  { code: "+98", label: "IR (+98)" },
  { code: "+211", label: "SS (+211)" },
  { code: "+212", label: "MA (+212)" },
  { code: "+213", label: "DZ (+213)" },
  { code: "+216", label: "TN (+216)" },
  { code: "+218", label: "LY (+218)" },
  { code: "+220", label: "GM (+220)" },
  { code: "+221", label: "SN (+221)" },
  { code: "+222", label: "MR (+222)" },
  { code: "+223", label: "ML (+223)" },
  { code: "+224", label: "GN (+224)" },
  { code: "+225", label: "CI (+225)" },
  { code: "+226", label: "BF (+226)" },
  { code: "+227", label: "NE (+227)" },
  { code: "+228", label: "TG (+228)" },
  { code: "+229", label: "BJ (+229)" },
  { code: "+230", label: "MU (+230)" },
  { code: "+231", label: "LR (+231)" },
  { code: "+232", label: "SL (+232)" },
  { code: "+233", label: "GH (+233)" },
  { code: "+234", label: "NG (+234)" },
  { code: "+235", label: "TD (+235)" },
  { code: "+236", label: "CF (+236)" },
  { code: "+237", label: "CM (+237)" },
  { code: "+238", label: "CV (+238)" },
  { code: "+239", label: "ST (+239)" },
  { code: "+240", label: "GQ (+240)" },
  { code: "+241", label: "GA (+241)" },
  { code: "+242", label: "CG (+242)" },
  { code: "+243", label: "CD (+243)" },
  { code: "+244", label: "AO (+244)" },
  { code: "+245", label: "GW (+245)" },
  { code: "+248", label: "SC (+248)" },
  { code: "+249", label: "SD (+249)" },
  { code: "+250", label: "RW (+250)" },
  { code: "+251", label: "ET (+251)" },
  { code: "+252", label: "SO (+252)" },
  { code: "+253", label: "DJ (+253)" },
  { code: "+254", label: "KE (+254)" },
  { code: "+255", label: "TZ (+255)" },
  { code: "+256", label: "UG (+256)" },
  { code: "+257", label: "BI (+257)" },
  { code: "+258", label: "MZ (+258)" },
  { code: "+260", label: "ZM (+260)" },
  { code: "+261", label: "MG (+261)" },
  { code: "+262", label: "RE/YT (+262)" },
  { code: "+263", label: "ZW (+263)" },
  { code: "+264", label: "NA (+264)" },
  { code: "+265", label: "MW (+265)" },
  { code: "+266", label: "LS (+266)" },
  { code: "+267", label: "BW (+267)" },
  { code: "+268", label: "SZ (+268)" },
  { code: "+269", label: "KM (+269)" },
  { code: "+290", label: "SH (+290)" },
  { code: "+291", label: "ER (+291)" },
  { code: "+297", label: "AW (+297)" },
  { code: "+298", label: "FO (+298)" },
  { code: "+299", label: "GL (+299)" },
  { code: "+350", label: "GI (+350)" },
  { code: "+351", label: "PT (+351)" },
  { code: "+352", label: "LU (+352)" },
  { code: "+353", label: "IE (+353)" },
  { code: "+354", label: "IS (+354)" },
  { code: "+355", label: "AL (+355)" },
  { code: "+356", label: "MT (+356)" },
  { code: "+357", label: "CY (+357)" },
  { code: "+358", label: "FI (+358)" },
  { code: "+359", label: "BG (+359)" },
  { code: "+370", label: "LT (+370)" },
  { code: "+371", label: "LV (+371)" },
  { code: "+372", label: "EE (+372)" },
  { code: "+373", label: "MD (+373)" },
  { code: "+374", label: "AM (+374)" },
  { code: "+375", label: "BY (+375)" },
  { code: "+376", label: "AD (+376)" },
  { code: "+377", label: "MC (+377)" },
  { code: "+378", label: "SM (+378)" },
  { code: "+380", label: "UA (+380)" },
  { code: "+381", label: "RS (+381)" },
  { code: "+382", label: "ME (+382)" },
  { code: "+383", label: "XK (+383)" },
  { code: "+385", label: "HR (+385)" },
  { code: "+386", label: "SI (+386)" },
  { code: "+387", label: "BA (+387)" },
  { code: "+389", label: "MK (+389)" },
  { code: "+420", label: "CZ (+420)" },
  { code: "+421", label: "SK (+421)" },
  { code: "+423", label: "LI (+423)" },
  { code: "+500", label: "FK (+500)" },
  { code: "+501", label: "BZ (+501)" },
  { code: "+502", label: "GT (+502)" },
  { code: "+503", label: "SV (+503)" },
  { code: "+504", label: "HN (+504)" },
  { code: "+505", label: "NI (+505)" },
  { code: "+506", label: "CR (+506)" },
  { code: "+507", label: "PA (+507)" },
  { code: "+508", label: "PM (+508)" },
  { code: "+509", label: "HT (+509)" },
  { code: "+590", label: "GP/BL/MF (+590)" },
  { code: "+591", label: "BO (+591)" },
  { code: "+592", label: "GY (+592)" },
  { code: "+593", label: "EC (+593)" },
  { code: "+594", label: "GF (+594)" },
  { code: "+595", label: "PY (+595)" },
  { code: "+596", label: "MQ (+596)" },
  { code: "+597", label: "SR (+597)" },
  { code: "+598", label: "UY (+598)" },
  { code: "+599", label: "CW/BQ (+599)" },
  { code: "+670", label: "TL (+670)" },
  { code: "+672", label: "NF (+672)" },
  { code: "+673", label: "BN (+673)" },
  { code: "+674", label: "NR (+674)" },
  { code: "+675", label: "PG (+675)" },
  { code: "+676", label: "TO (+676)" },
  { code: "+677", label: "SB (+677)" },
  { code: "+678", label: "VU (+678)" },
  { code: "+679", label: "FJ (+679)" },
  { code: "+680", label: "PW (+680)" },
  { code: "+681", label: "WF (+681)" },
  { code: "+682", label: "CK (+682)" },
  { code: "+683", label: "NU (+683)" },
  { code: "+685", label: "WS (+685)" },
  { code: "+686", label: "KI (+686)" },
  { code: "+687", label: "NC (+687)" },
  { code: "+688", label: "TV (+688)" },
  { code: "+689", label: "PF (+689)" },
  { code: "+690", label: "TK (+690)" },
  { code: "+691", label: "FM (+691)" },
  { code: "+692", label: "MH (+692)" },
  { code: "+850", label: "KP (+850)" },
  { code: "+852", label: "HK (+852)" },
  { code: "+853", label: "MO (+853)" },
  { code: "+855", label: "KH (+855)" },
  { code: "+856", label: "LA (+856)" },
  { code: "+880", label: "BD (+880)" },
  { code: "+886", label: "TW (+886)" },
  { code: "+960", label: "MV (+960)" },
  { code: "+961", label: "LB (+961)" },
  { code: "+962", label: "JO (+962)" },
  { code: "+963", label: "SY (+963)" },
  { code: "+964", label: "IQ (+964)" },
  { code: "+965", label: "KW (+965)" },
  { code: "+966", label: "SA (+966)" },
  { code: "+967", label: "YE (+967)" },
  { code: "+968", label: "OM (+968)" },
  { code: "+970", label: "PS (+970)" },
  { code: "+971", label: "AE (+971)" },
  { code: "+972", label: "IL (+972)" },
  { code: "+973", label: "BH (+973)" },
  { code: "+974", label: "QA (+974)" },
  { code: "+975", label: "BT (+975)" },
  { code: "+976", label: "MN (+976)" },
  { code: "+977", label: "NP (+977)" },
  { code: "+992", label: "TJ (+992)" },
  { code: "+993", label: "TM (+993)" },
  { code: "+994", label: "AZ (+994)" },
  { code: "+995", label: "GE (+995)" },
  { code: "+996", label: "KG (+996)" },
  { code: "+998", label: "UZ (+998)" }
];


export function PhoneInput({ label, error, className, value, onChange, ...props }: PhoneInputProps) {
  // Parse value
  const { countryCode, mobileNumber } = useMemo(() => {
    const matches = value.match(/^(\+\d{1,4})\s?(.*)$/);
    if (matches) {
      return { countryCode: matches[1], mobileNumber: matches[2] };
    }
    return { countryCode: "+91", mobileNumber: value };
  }, [value]);

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    onChange(`${newCode} ${mobileNumber}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    onChange(`${countryCode} ${newNumber}`);
  };

  return (
    <label className="block space-y-1">
      {label ? (
        <span className="text-sm font-medium text-slate-700">
          {label}
          {props.required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
      ) : null}
      <div
        className={clsx(
          "flex w-full items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white/95 ring-brand-500 transition focus-within:border-brand-200 focus-within:ring-2",
          className
        )}
      >
        <select
          className="border-0 border-r border-slate-200 bg-transparent px-3 py-3 text-sm text-slate-700 outline-none focus:ring-0"
          value={countryCode}
          onChange={handleCountryCodeChange}
        >
          {COUNTRY_CODES.map((cc) => (
            <option key={cc.code} value={cc.code}>
              {cc.label}
            </option>
          ))}
        </select>
        <input
          className="w-full border-0 bg-transparent px-4 py-3 text-sm outline-none focus:ring-0"
          value={mobileNumber}
          onChange={handleNumberChange}
          {...props}
        />
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
