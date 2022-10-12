type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | IJSONArray;
type JSONObject = { [member: string]: JSONValue };
interface IJSONArray extends Array<JSONValue> {}
