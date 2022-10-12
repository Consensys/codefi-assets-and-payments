import { Injectable, PipeTransform } from '@nestjs/common';

// (tags that can be opened/closed) | (tags that stand alone)
const basic_tag_whitelist =
  /^(<\/?(b|blockquote|code|del|dd|dl|dt|em|h1|h2|h3|i|kbd|li|ol|p|s|sup|sub|strong|strike|ul)>|<(br|hr)\s?\/?>)$/i;
// <a href="url..." optional title>|</a>
const a_white =
  /^(<a\shref="(https?:(\/\/|\/)|ftp:(\/\/|\/)|mailto:|magnet:)[-A-Za-z0-9+&@#/%?=~_|!:,.;()]+"(\stitle="[^"<>]+")?\s?>|<\/a>)$/i;

// <img src="url..." optional width  optional height  optional alt  optional title
const img_white =
  /^(<img\ssrc="(https?:\/\/|\/)[-A-Za-z0-9+&@#/%?=~_|!:,.;()]+"(\swidth="\d{1,3}")?(\sheight="\d{1,3}")?(\salt="[^"<>]*")?(\stitle="[^"<>]*")?\s?\/?>)$/i;

// <pre optional class="prettyprint linenums">|</pre> for twitter bootstrap
const pre_white = /^(<pre(\sclass="prettyprint linenums")?>|<\/pre>)$/i;

function sanitizeTag(tag) {
  if (
    tag.match(basic_tag_whitelist) ||
    tag.match(a_white) ||
    tag.match(img_white) ||
    tag.match(pre_white)
  )
    return tag;
  else return '';
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  constructor(private readonly className: string) {}

  transform(value: string) {
    return value.replace(/<[^>]*>?/gi, sanitizeTag);
  }
}
