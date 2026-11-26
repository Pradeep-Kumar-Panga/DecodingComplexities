// Minimal TextMate grammar for free-form RPGLE (Shiki does not bundle one).
export const rpgleGrammar = {
  name: "rpgle",
  scopeName: "source.rpgle",
  patterns: [
    { name: "comment.line.double-slash.rpgle", match: "//.*$" },
    { name: "comment.line.free.rpgle", match: "^\\*\\*(?i:free)\\b.*$" },
    { name: "string.quoted.single.rpgle", match: "(?:[dtxz]|[a-z]{1,2})?'(?:[^']|'')*'" },
    { name: "storage.type.rpgle", match: "(?i)\\b(?:dcl|end)-(?:s|c|f|ds|pr|pi|proc|parm|subf|enum)\\b|\\bctl-opt\\b" },
    {
      name: "keyword.control.rpgle",
      match:
        "(?i)\\b(?:if|elseif|else|endif|dow|dou|enddo|for|endfor|select|when|other|endsl|monitor|on-error|endmon|return|leave|iter|callp|call|eval|read|reade|readp|chain|setll|setgt|write|update|delete|exsr|begsr|endsr|dsply|clear|reset|open|close|exec sql|inz|keyed|packed|char|varchar|zoned|int|date|time|timestamp|ind|like|qualified|dim|const|value|to|downto|by|and|or|not|in|likeds)\\b",
    },
    { name: "support.function.rpgle", match: "%\\w+" },
    { name: "constant.language.rpgle", match: "\\*\\w+" },
    { name: "constant.numeric.rpgle", match: "\\b\\d+(?:\\.\\d+)?\\b" },
    { name: "keyword.operator.rpgle", match: "\\+=|-=|\\*=|/=|<>|<=|>=|[-+*/=<>:]" },
  ],
};
