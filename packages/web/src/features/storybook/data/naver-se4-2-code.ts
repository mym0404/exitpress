import type { StorybookDefinition } from "../schema/StorybookDefinition.js"

export const naverSe42Code = {
  storyKey: "naver-se4-2-code",
  screenshotSrc: "naver-se4-2-code.png",
  editorType: "naver-se4",
  editorLabel: "SmartEditor 4",
  blockIndex: 2,
  blockId: "code",
  blockLabel: "코드",
  group: "output",
  sourceUrl: "https://blog.naver.com/mym0404/223034929697",
  inspectPath: "0",
  inputHtml:
    '<div id="viewTypeSelector">\n<div class="se-component se-code se-l-code_black" id="SE-cfd2d446-a1f4-45ca-910d-a2f47f178a49">\n                    <div class="se-component-content">\n                        <div class="se-section se-section-code se-l-code_black">\n                            <div class="se-module se-module-code se-fs-fs13">\n                                <div class="se-code-source">\n                                    <div class="__se_code_view language-javascript">const ll mod = 9901;\ninline ll md(ll x) { return md(mod, x); }\nvoid solve() {\n   int n, t = 1;\n\n   vi g(1000001);\n   g[1] = 1;\n   for (int i = 2; i &lt;= 1000000; i++) {\n      g[i] = md(g[i - 1] * 2 + 1);\n   }\n   vi f(1000001);\n   f[1] = 1;\n   f[2] = 3;\n   f[3] = 5;\n   for (int i = 4; i &lt;= 1000000; i++) {\n      int k = i - round(sqrt(i * 2 + 1)) + 1;\n      f[i] = md(f[k] * 2 + g[i - k]);\n   }\n   cin &gt;&gt; n;\n   cout &lt;&lt; f[n];\n}</div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <script type="text/data" class="__se_module_data" data-module="{&quot;type&quot;:&quot;v2_code&quot;, &quot;id&quot; : &quot;SE-cfd2d446-a1f4-45ca-910d-a2f47f178a49&quot;}"></script>\n                </div>\n</div>',
} satisfies StorybookDefinition
