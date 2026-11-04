# Frame fastening and comb alignment update

2026-11-04. This update supersedes the frame and pending-comb sections of the dated October assembly notes. It retains the 14-layer, 28-column, 1,736-magnet baseline and existing magnetic solver.

Stage 8 now shows the holders being bolted to the aluminium profiles. Eight frame-side holes per layer are measured from the registered support CAD: three at each side support and two at the lower support. The animation seats the layer, places the matching T-slot nuts, inserts the mounting bolts and then illustrates tightening. Hole diameter alone is not used to infer the bolt thread, head, length or tightening torque. The mounting hardware remains the supplied configuration.

第 8 步明确展示支撑与铝型材的螺栓连接。孔位来自现有支撑 CAD：左右支撑各三个，底部两个，每层共八处。动作依次为磁层落位、T 型槽螺母就位、螺栓插入与紧固。孔径不被擅自当成螺纹规格。

Stage 11 follows the user's confirmed count of 13 inter-layer gaps with six identical locating structures in every gap, three on the upper semicircle and three on the lower: 78 locating units. It does not instantiate 78 complete long comb profiles.

The supplied comb STEP contains two source profiles: four 20 mm slots at 38 mm pitch in a 170 mm body, and five slots at the same pitch in a 208 mm body. Both use 18 mm teeth. A closed teaching unit is derived from the actual 69-vertex tooth cross-section and extruded through the source 18 mm tooth width. Its geometry is identified as a source-derived illustration, rather than an independently supplied manufacturing STEP.

第 11 步按 13 个层间间隙、每处六个相同定位结构展示，共 78 处，上下半圆各三个。原 STEP 中的四槽、五槽长轮廓是来源参考，不等于需制造 78 根长梳状件。网页单元沿用来源 CAD 的真实齿形截面和 18 mm 宽度，并明确标记为教学派生模型。

The displayed locating units use nominal housing-to-cap gaps of 18 mm at Z centres 229 − 38i mm for i=0…12. These are different from the 26 mm magnet-face gaps. The tooth and gap have nominal axial face contact; the animation does not establish manufacturing allowance or physical clamping force.

The six station angles are 22°, 82°, 142°, 202°, 248° and 322° in the displayed assembly XY frame. They keep three stations on each semicircle while adjusting the position near the lower support. The selected positions and the full 44 mm radial approach are checked against conservative triangle projections of the source-derived holders and displayed frame. The rods lie well inside the locator profiles; the 18 mm units remain in the inter-layer intervals. This is a nominal-model intersection check, not certification of manufacturing tolerances. A rigidly uniform six-station pattern was not substituted for the collision-avoiding arrangement.

为避开底部支撑，六处位置采用 22°、82°、142°、202°、248°、322°，不声称严格六等分。最终位置及径向安装路径均按模型三角形做避让检查。18 mm 单元位于 18 mm 名义层间间隙，端面允许接触；打印公差、固定方式与实际配合另按制造设计核对。

The two CAD downloads are kept byte-for-byte as supplied:

| Download | SHA-256 |
| --- | --- |
| Final.step | 1f15738912bae235e508296b7331f9fe8f77b38640c4633b7e15cf7aa106e3fe |
| comb-device.step | 07f7ef3f60a37d27adb3a91d31e4900f6cc36c78f33a389861a7b2314acd003e |

Final.step contains the supplied assembly, with no identified comb instance. The separate comb STEP is therefore downloadable alongside it. Participants can inspect the source CAD and prepare their own print jobs. The previous four 3MF downloads and their time table are withdrawn from the website; original engineering files are preserved. The resource-refresh policy cannot republish the retired batches or silently replace a checked CAD download with an unreviewed source draft.

两份 CAD 文件保持原始字节。Final.step 不被宣称已经包含后来单独提供的梳状件，因此两份 STEP 均可下载。旧的四份 3MF 网页副本和打印时长表已撤下，原始工程文件保留。MATLAB 教学下载继续标记待更新。

Progress version 5 preserves the current selected layer and unrelated completed stages from version 4, but requires review of the new frame-fastening and comb checks. Playback and completion remain independent; playing the animation does not mark the physical build complete. Models must be loaded before Play or Replay becomes available.

Renderer cleanup now releases per-viewer CAD clones and retired WebGL contexts while retaining the reusable CPU cache. Opening and closing a part viewer must leave its paused parent intact; repeatedly switching teaching sections must keep the Lab model available.
