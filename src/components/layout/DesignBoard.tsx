// import {
//   useRef,
//   useState,
//   useEffect,
//   useLayoutEffect,
//   useCallback,
// } from "react";
// // ... (All other imports remain the same)
// import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Check,
//   Trash2,
//   Hand,
//   MousePointer2,
//   ArrowLeft,
//   Type,
//   Bold,
//   Italic,
//   Underline,
//   Image as ImageIcon,
//   X,
//   Move,
//   RotateCw,
//   Square,
//   Circle,
//   MoveVertical,
// } from "lucide-react";
// import type { Orientation, PaperKey } from "@/pages/Home";
// import {
//   ContextMenu,
//   ContextMenuContent,
//   ContextMenuItem,
//   ContextMenuTrigger,
// } from "../ui/context-menu";

// /* --- CONFIGURATION & HELPER FUNCTIONS --- */
// // ... (Keep existing configuration, helper functions, and ColorPicker component exactly as they were) ...
// const DPI = 150;
// const MM_TO_INCH = 25.4;

// const getSizeFromMM = (mmW: number, mmH: number) => ({
//   w: Math.floor((mmW / MM_TO_INCH) * DPI),
//   h: Math.floor((mmH / MM_TO_INCH) * DPI),
// });

// const PAPER_SIZES: Record<PaperKey, { w: number; h: number }> = {
//   A5: getSizeFromMM(148, 210),
//   A4: getSizeFromMM(210, 297),
//   A3: getSizeFromMM(297, 420),
//   A2: getSizeFromMM(420, 594),
//   Letter: getSizeFromMM(215.9, 279.4),
//   Tabloid: getSizeFromMM(279.4, 431.8),
//   Instagram: { w: 1080, h: 1080 },
//   Twitter: { w: 1200, h: 675 },
//   FHD: { w: 1920, h: 1080 },
// };

// const ZOOM_PRESETS = [300, 200, 150, 100, 75, 50, 25, 10];
// const FONTS = ["Inter", "Arial", "Times New Roman", "Courier New", "Georgia"];
// const PRESET_COLORS = [
//   "transparent",
//   "#ffffff",
//   "#000000",
//   "#FF0000",
//   "#00FF00",
//   "#0000FF",
//   "#FFFF00",
//   "#00FFFF",
//   "#FF00FF",
//   "#C0C0C0",
//   "#808080",
//   "#800000",
//   "#800000",
//   "#008000",
//   "#800080",
//   "#008080",
//   "#000080",
// ];

// type ToolType = "select" | "hand" | "draw-rect";

// interface BaseObject {
//   id: string;
//   type: "text" | "rect";
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   rotation: number;
// }

// interface TextObject extends BaseObject {
//   type: "text";
//   text: string;
//   fontSize: number;
//   fontFamily: string;
//   color: string;
//   isBold: boolean;
//   isItalic: boolean;
//   isUnderline: boolean;
// }

// interface RectObject extends BaseObject {
//   type: "rect";
//   fillColor: string;
//   strokeColor: string;
//   strokeWidth: number;
//   borderRadius: number;
// }

// type CanvasObject = TextObject | RectObject;

// /* --- COLOR PICKER COMPONENT --- */
// // (Keep exactly as before)
// interface ColorPickerProps {
//   value: string;
//   onChange: (value: string) => void;
//   title?: string;
//   allowTransparent?: boolean;
// }

// const ColorPicker = ({
//   value,
//   onChange,
//   title,
//   allowTransparent,
// }: ColorPickerProps) => {
//   const [localValue, setLocalValue] = useState(
//     value === "transparent" ? "#ffffff" : value
//   );

//   useEffect(() => {
//     if (value !== "transparent") setLocalValue(value);
//   }, [value]);

//   const handleCustomChange = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       const newVal = e.target.value;
//       setLocalValue(newVal);
//       const timeoutId = setTimeout(() => {
//         onChange(newVal);
//       }, 10);
//       return () => clearTimeout(timeoutId);
//     },
//     [onChange]
//   );

//   return (
//     <Popover>
//       <PopoverTrigger asChild>
//         <Button
//           variant="outline"
//           className={`w-8 h-8 rounded-full p-0 border shadow-sm ${
//             value === "transparent" ? "bg-white" : ""
//           }`}
//           style={value !== "transparent" ? { backgroundColor: value } : {}}
//           title={title}
//         >
//           {value === "transparent" && (
//             <div className="w-full h-px bg-red-500 rotate-45" />
//           )}
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-64 p-3">
//         <div className="grid grid-cols-4 gap-2 mb-3">
//           {PRESET_COLORS.filter(
//             (c) => allowTransparent || c !== "transparent"
//           ).map((c) => (
//             <button
//               key={c}
//               onClick={() => onChange(c)}
//               className={`w-8 h-8 rounded-full border shadow-sm hover:scale-110 transition-transform relative overflow-hidden ${
//                 c === "transparent" ? "bg-gray-100" : ""
//               }`}
//               style={c !== "transparent" ? { backgroundColor: c } : {}}
//               title={c === "transparent" ? "No Fill" : c}
//             >
//               {c === "transparent" && (
//                 <div className="absolute inset-0 w-full h-full flex items-center justify-center">
//                   <div className="w-full h-px bg-red-500 rotate-45" />
//                 </div>
//               )}
//             </button>
//           ))}
//         </div>
//         <div className="flex items-center gap-2 border-t pt-2">
//           <span className="text-xs text-gray-500">Hex:</span>
//           <input
//             type="color"
//             value={localValue}
//             onChange={handleCustomChange}
//             className="h-8 w-full cursor-pointer"
//             disabled={value === "transparent"}
//           />
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// };

// /* --- TRANSFORM WRAPPER COMPONENT --- */
// // (Keep exactly as before)
// const TransformWrapper = ({
//   children,
//   obj,
//   zoom,
//   isSelected,
//   tool,
//   onMouseDown,
//   setResizingTarget,
//   setRotatingTarget,
// }: {
//   children: React.ReactNode;
//   obj: CanvasObject;
//   zoom: number;
//   isSelected: boolean;
//   tool: ToolType;
//   onMouseDown: (e: React.MouseEvent) => void;
//   setResizingTarget: any;
//   setRotatingTarget: any;
// }) => {
//   const zoomFactor = zoom / 100;

//   return (
//     <div
//       onMouseDown={onMouseDown}
//       style={{
//         position: "absolute",
//         left: `${obj.x * zoomFactor}px`,
//         top: `${obj.y * zoomFactor}px`,
//         width: `${obj.width * zoomFactor}px`,
//         height: `${obj.height * zoomFactor}px`,
//         transform: `rotate(${obj.rotation}deg)`,
//         transformOrigin: "center center",
//         pointerEvents:
//           tool === "hand" || tool === "draw-rect" ? "none" : "auto",
//       }}
//       className="group"
//     >
//       {children}

//       {isSelected && (
//         <div className="absolute -inset-1 border-2 border-blue-500 pointer-events-none">
//           <div
//             className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-sm cursor-nwse-resize pointer-events-auto shadow-sm z-50"
//             onMouseDown={(e) => {
//               e.stopPropagation();
//               setResizingTarget({
//                 id: obj.id,
//                 startX: e.pageX,
//                 startY: e.pageY,
//                 startW: obj.width,
//                 startH: obj.height,
//               });
//             }}
//           />
//           <div
//             className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-4 bg-white border border-blue-500 rounded-sm cursor-ew-resize pointer-events-auto shadow-sm z-50"
//             onMouseDown={(e) => {
//               e.stopPropagation();
//               setResizingTarget({
//                 id: obj.id,
//                 startX: e.pageX,
//                 startY: e.pageY,
//                 startW: obj.width,
//                 startH: obj.height,
//                 direction: "x",
//               });
//             }}
//           />
//           <div className="absolute -top-3 -left-3 bg-white border border-blue-500 p-0.5 rounded-sm shadow-sm pointer-events-none scale-75">
//             <Move className="w-3 h-3 text-blue-500" />
//           </div>
//           <div
//             className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-blue-500 rounded-full cursor-grab pointer-events-auto shadow-sm flex items-center justify-center hover:bg-blue-50"
//             onMouseDown={(e) => {
//               e.stopPropagation();
//               setRotatingTarget({ id: obj.id });
//             }}
//           >
//             <RotateCw className="w-3.5 h-3.5 text-blue-500" />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// /* --- TEXT ITEM COMPONENT --- */
// // (Keep exactly as before)
// const TextItem = ({
//   obj,
//   zoom,
//   isSelected,
//   tool,
//   onUpdate,
//   setDragTarget,
//   setSelectedId,
//   setResizingTarget,
//   setRotatingTarget,
//   innerRef,
// }: any) => {
//   const textAreaRef = useRef<HTMLTextAreaElement>(null);
//   const zoomFactor = zoom / 100;

//   useLayoutEffect(() => {
//     if (textAreaRef.current) {
//       textAreaRef.current.style.height = "inherit";
//       textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
//     }
//   }, [obj.text, obj.width, obj.fontSize, obj.fontFamily, zoom]);

//   return (
//     <TransformWrapper
//       obj={obj}
//       zoom={zoom}
//       isSelected={isSelected}
//       tool={tool}
//       setResizingTarget={setResizingTarget}
//       setRotatingTarget={setRotatingTarget}
//       onMouseDown={(e) => {
//         if (tool !== "select") return;
//         e.stopPropagation();
//         setSelectedId(obj.id);
//         setDragTarget({
//           id: obj.id,
//           offsetX: e.nativeEvent.offsetX,
//           offsetY: e.nativeEvent.offsetY,
//         });
//       }}
//     >
//       <div ref={innerRef} className="w-full h-full">
//         <textarea
//           ref={textAreaRef}
//           value={obj.text}
//           onChange={(e) => onUpdate(obj.id, { text: e.target.value })}
//           className={`
//                     w-full bg-transparent resize-none overflow-hidden leading-normal
//                     focus:outline-none outline-none border-none p-1 block
//                     ${isSelected ? "cursor-text" : "cursor-move"}
//                 `}
//           style={{
//             fontFamily: obj.fontFamily,
//             fontSize: `${obj.fontSize * zoomFactor}px`,
//             color: obj.color,
//             fontWeight: obj.isBold ? "bold" : "normal",
//             fontStyle: obj.isItalic ? "italic" : "normal",
//             textDecoration: obj.isUnderline ? "underline" : "none",
//             height: "100%",
//           }}
//           readOnly={tool === "hand"}
//         />
//       </div>
//     </TransformWrapper>
//   );
// };

// /* --- RECT ITEM COMPONENT --- */
// // (Keep exactly as before)
// const RectItem = ({ obj, innerRef, ...props }: any) => {
//   return (
//     <TransformWrapper
//       obj={obj}
//       {...props}
//       onMouseDown={(e) => {
//         if (props.tool !== "select") return;
//         e.stopPropagation();
//         props.setSelectedId(obj.id);
//         props.setDragTarget({ id: obj.id });
//       }}
//     >
//       <div
//         ref={innerRef}
//         className="w-full h-full"
//         style={{
//           backgroundColor: obj.fillColor,
//           border: `${obj.strokeWidth * (props.zoom / 100)}px solid ${
//             obj.strokeColor
//           }`,
//           borderRadius: `${obj.borderRadius * (props.zoom / 100)}px`,
//         }}
//       />
//     </TransformWrapper>
//   );
// };

// /* --- MAIN COMPONENT --- */

// interface DesignBoardProps {
//   paper: PaperKey;
//   orientation: Orientation;
//   onBack: () => void;
// }

// export default function DesignBoard({
//   paper,
//   orientation,
//   onBack,
// }: DesignBoardProps) {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const containerRef = useRef<HTMLDivElement | null>(null);

//   const isDragging = useRef(false);
//   const isDrawing = useRef(false);
//   const startX = useRef(0);
//   const startY = useRef(0);
//   const scrollLeftRef = useRef(0);
//   const scrollTopRef = useRef(0);
//   const prevZoom = useRef<number>(40);
//   const shouldCenterZoom = useRef(false);

//   const drawingStartPos = useRef<{ x: number; y: number } | null>(null);
//   const [tempRect, setTempRect] = useState<RectObject | null>(null);
//   const objRefs = useRef<Record<string, HTMLDivElement | null>>({});

//   const [zoom, setZoom] = useState<number[]>([40]);
//   const [tool, setTool] = useState<ToolType>("select");

//   const [objects, setObjects] = useState<CanvasObject[]>([]);
//   const [selectedId, setSelectedId] = useState<string | null>(null);

//   // NEW: State to handle toolbar animation closing
//   const [isClosingToolbar, setIsClosingToolbar] = useState(false);

//   const [dragTarget, setDragTarget] = useState<{ id: string } | null>(null);
//   const [resizingTarget, setResizingTarget] = useState<{
//     id: string;
//     startX: number;
//     startY: number;
//     startW: number;
//     startH: number;
//     direction?: "x" | "xy";
//   } | null>(null);
//   const [rotatingTarget, setRotatingTarget] = useState<{ id: string } | null>(
//     null
//   );

//   const selectedObject = objects.find((t) => t.id === selectedId);

//   const [bgColor, setBgColor] = useState("#ffffff");

//   const { w, h } = PAPER_SIZES[paper];
//   const width = orientation === "portrait" ? w : h;
//   const height = orientation === "portrait" ? h : w;

//   /* --- ACTIONS --- */

//   const updateObject = (id: string, updates: Partial<CanvasObject>) => {
//     setObjects((prev) =>
//       prev.map(
//         (obj) => (obj.id === id ? { ...obj, ...updates } : obj) as CanvasObject
//       )
//     );
//   };

//   const updateSelected = (updates: Partial<CanvasObject>) => {
//     if (selectedId) updateObject(selectedId, updates);
//   };

//   // NEW: Handle the close button logic
//   const handleCloseToolbar = () => {
//     setIsClosingToolbar(true); // Trigger animation
//     setTimeout(() => {
//       setSelectedId(null); // Remove selection after animation finishes
//       setIsClosingToolbar(false); // Reset state
//     }, 300); // 300ms matches the duration-300 class
//   };

//   /* --- KEYBOARD SHORTCUTS --- */
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       // Duplicate: Ctrl + D
//       if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
//         e.preventDefault();
//         if (selectedId) {
//           const objToDuplicate = objects.find((o) => o.id === selectedId);
//           if (objToDuplicate) {
//             const newId = Math.random().toString(36).substr(2, 9);
//             const newObj = {
//               ...objToDuplicate,
//               id: newId,
//               x: objToDuplicate.x + 20,
//               y: objToDuplicate.y + 20,
//             };
//             setObjects((prev) => [...prev, newObj]);
//             setSelectedId(newId);
//           }
//         }
//       }

//       // Delete
//       if (
//         e.key === "Delete" ||
//         (e.key === "Backspace" &&
//           document.activeElement?.tagName !== "TEXTAREA" &&
//           document.activeElement?.tagName !== "INPUT")
//       ) {
//         if (selectedId) handleDeleteSelected();
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [selectedId, objects]);

//   const handleAddText = () => {
//     const newId = Math.random().toString(36).substr(2, 9);
//     const newText: TextObject = {
//       id: newId,
//       type: "text",
//       x: width / 2 - 100,
//       y: height / 2 - 20,
//       text: "Double click to edit",
//       width: 200,
//       height: 50,
//       rotation: 0,
//       fontSize: 24,
//       fontFamily: "Inter",
//       color: "#000000",
//       isBold: false,
//       isItalic: false,
//       isUnderline: false,
//     };
//     setObjects([...objects, newText]);
//     setSelectedId(newId);
//     setTool("select");
//   };

//   const handleDeleteSelected = () => {
//     if (selectedId) {
//       setObjects((prev) => prev.filter((t) => t.id !== selectedId));
//       setSelectedId(null);
//     } else {
//       setObjects([]);
//     }
//   };

//   /* --- ZOOM & CANVAS EFFECT HOOKS --- */
//   // (Keep all useEffects for Zoom, Canvas Scale, Fit, Wheel exactly as before)
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;
//     const handleWheel = (e: WheelEvent) => {
//       if (e.ctrlKey || e.metaKey) {
//         e.preventDefault();
//         e.stopPropagation();
//         const sensitivity = 0.5;
//         const delta = -e.deltaY * sensitivity;
//         setZoom((prev) => [Math.min(Math.max(prev[0] + delta, 10), 300)]);
//       }
//     };
//     container.addEventListener("wheel", handleWheel, { passive: false });
//     return () => container.removeEventListener("wheel", handleWheel);
//   }, []);

//   useEffect(() => {
//     if (containerRef.current) containerRef.current.style.cursor = "";
//   }, [tool]);

//   useLayoutEffect(() => {
//     if (!containerRef.current) return;
//     const container = containerRef.current;
//     if (shouldCenterZoom.current) {
//       const { scrollWidth, scrollHeight, clientWidth, clientHeight } =
//         container;
//       container.scrollLeft = (scrollWidth - clientWidth) / 2;
//       container.scrollTop = (scrollHeight - clientHeight) / 2;
//       shouldCenterZoom.current = false;
//       prevZoom.current = zoom[0];
//       return;
//     }
//     if (zoom[0] !== prevZoom.current && prevZoom.current > 0) {
//       const { clientWidth, clientHeight, scrollLeft, scrollTop } = container;
//       const scale = zoom[0] / prevZoom.current;
//       container.scrollLeft =
//         (scrollLeft + clientWidth / 2) * scale - clientWidth / 2;
//       container.scrollTop =
//         (scrollTop + clientHeight / 2) * scale - clientHeight / 2;
//       prevZoom.current = zoom[0];
//     }
//   }, [zoom]);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;
//     const scale = window.devicePixelRatio || 1;
//     canvas.width = width * scale;
//     canvas.height = height * scale;
//     ctx.setTransform(scale, 0, 0, scale, 0, 0);
//   }, [width, height]);

//   const handleFit = () => {
//     if (!containerRef.current) return;
//     const { clientWidth, clientHeight } = containerRef.current;
//     shouldCenterZoom.current = true;
//     setZoom([
//       Math.floor(
//         Math.min((clientWidth - 80) / width, (clientHeight - 80) / height) * 100
//       ),
//     ]);
//   };

//   /* --- MOUSE HANDLERS --- */
//   // (Keep all mouse handlers exactly as before)
//   const getPointerPos = (e: React.MouseEvent) => {
//     if (!containerRef.current) return { x: 0, y: 0 };
//     const rect = canvasRef.current?.getBoundingClientRect();
//     if (!rect) return { x: 0, y: 0 };
//     const x = (e.clientX - rect.left) / (zoom[0] / 100);
//     const y = (e.clientY - rect.top) / (zoom[0] / 100);
//     return { x, y };
//   };

//   const handleGlobalMouseMove = (e: React.MouseEvent) => {
//     const currentZoom = zoom[0] / 100;
//     if (isDrawing.current && drawingStartPos.current) {
//       const { x, y } = getPointerPos(e);
//       const startX = drawingStartPos.current.x;
//       const startY = drawingStartPos.current.y;
//       const w = Math.abs(x - startX);
//       const h = Math.abs(y - startY);
//       const newX = Math.min(x, startX);
//       const newY = Math.min(y, startY);
//       setTempRect({
//         id: "temp",
//         type: "rect",
//         x: newX,
//         y: newY,
//         width: Math.max(10, w),
//         height: Math.max(10, h),
//         rotation: 0,
//         fillColor: "transparent",
//         strokeColor: "#000000",
//         strokeWidth: 2,
//         borderRadius: 0,
//       });
//       return;
//     }
//     if (rotatingTarget) {
//       e.preventDefault();
//       const el = objRefs.current[rotatingTarget.id];
//       if (el) {
//         const rect = el.getBoundingClientRect();
//         const centerX = rect.left + rect.width / 2;
//         const centerY = rect.top + rect.height / 2;
//         const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
//         let angleDeg = (angleRad * 180) / Math.PI;
//         angleDeg -= 90;
//         updateObject(rotatingTarget.id, { rotation: angleDeg });
//       }
//       return;
//     }
//     if (resizingTarget) {
//       e.preventDefault();
//       const deltaX = (e.pageX - resizingTarget.startX) / currentZoom;
//       const deltaY = (e.pageY - resizingTarget.startY) / currentZoom;
//       const updates: any = {};
//       if (resizingTarget.direction === "x") {
//         updates.width = Math.max(10, resizingTarget.startW + deltaX);
//       } else {
//         updates.width = Math.max(10, resizingTarget.startW + deltaX);
//         updates.height = Math.max(10, resizingTarget.startH + deltaY);
//       }
//       updateObject(resizingTarget.id, updates);
//       return;
//     }
//     if (dragTarget) {
//       e.preventDefault();
//       const deltaX = e.movementX / currentZoom;
//       const deltaY = e.movementY / currentZoom;
//       const obj = objects.find((o) => o.id === dragTarget.id);
//       if (obj)
//         updateObject(dragTarget.id, { x: obj.x + deltaX, y: obj.y + deltaY });
//       return;
//     }
//     if (isDragging.current && containerRef.current) {
//       e.preventDefault();
//       const x = e.pageX - containerRef.current.offsetLeft;
//       const y = e.pageY - containerRef.current.offsetTop;
//       containerRef.current.scrollLeft =
//         scrollLeftRef.current - (x - startX.current);
//       containerRef.current.scrollTop =
//         scrollTopRef.current - (y - startY.current);
//     }
//   };

//   const handleGlobalMouseUp = () => {
//     if (isDrawing.current && tempRect) {
//       const newObj: RectObject = {
//         ...tempRect,
//         id: Math.random().toString(36).substr(2, 9),
//       };
//       setObjects([...objects, newObj]);
//       setSelectedId(newObj.id);
//       setTempRect(null);
//       setTool("select");
//     }
//     isDragging.current = false;
//     isDrawing.current = false;
//     drawingStartPos.current = null;
//     setDragTarget(null);
//     setResizingTarget(null);
//     setRotatingTarget(null);
//     if (containerRef.current)
//       containerRef.current.style.cursor = tool === "hand" ? "grab" : "";
//   };

//   const handleContainerMouseDown = (e: React.MouseEvent) => {
//     if (
//       e.target === containerRef.current ||
//       (e.target as HTMLElement).classList.contains("bg-wrapper") ||
//       (e.target as HTMLElement).tagName === "CANVAS"
//     ) {
//       if (tool !== "draw-rect") setSelectedId(null);
//     }
//     if (tool === "draw-rect") {
//       isDrawing.current = true;
//       drawingStartPos.current = getPointerPos(e);
//       return;
//     }
//     if (tool === "hand" || e.button === 1) {
//       if (!containerRef.current) return;
//       isDragging.current = true;
//       startX.current = e.pageX - containerRef.current.offsetLeft;
//       startY.current = e.pageY - containerRef.current.offsetTop;
//       scrollLeftRef.current = containerRef.current.scrollLeft;
//       scrollTopRef.current = containerRef.current.scrollTop;
//       containerRef.current.style.cursor = "grabbing";
//     }
//   };

//   return (
//     <div
//       className="flex flex-col h-screen w-full bg-gray-50 relative overflow-hidden"
//       onMouseUp={handleGlobalMouseUp}
//       onMouseMove={handleGlobalMouseMove}
//     >
//       <header className="grid grid-cols-3 items-center px-4 py-3 bg-white border-b shadow-sm z-30 h-16 relative">
//         {/* LEFT */}
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="icon" onClick={onBack} title="Back">
//             <ArrowLeft className="h-4 w-4" />
//           </Button>
//           <span className="h-6 w-px bg-gray-200"></span>
//           <Tabs value={tool} onValueChange={(v) => setTool(v as ToolType)}>
//             <TabsList className="grid w-36 grid-cols-3 h-9">
//               <TabsTrigger value="select" className="h-7 p-0">
//                 <MousePointer2 className="h-4 w-4" />
//               </TabsTrigger>
//               <TabsTrigger value="hand" className="h-7 p-0">
//                 <Hand className="h-4 w-4" />
//               </TabsTrigger>
//               <TabsTrigger value="draw-rect" className="h-7 p-0">
//                 <Square className="h-4 w-4" />
//               </TabsTrigger>
//             </TabsList>
//           </Tabs>
//           <span className="h-6 w-px bg-gray-200"></span>
//           <div className="flex flex-col text-xs text-gray-500">
//             <span className="font-semibold text-gray-900">{paper}</span>
//             <span className="capitalize">{orientation}</span>
//           </div>
//         </div>

//         {/* CENTER */}
//         <div className="flex items-center justify-center gap-2">
//           <ColorPicker
//             value={bgColor}
//             onChange={setBgColor}
//             title="Background Color"
//           />
//           <div className="h-6 w-px bg-gray-200 mx-1"></div>
//           <Button
//             variant="outline"
//             size="sm"
//             className="h-8 gap-2 px-3 text-xs"
//             onClick={handleAddText}
//           >
//             <Type className="h-3.5 w-3.5" /> Add Text
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             className="h-8 gap-2 px-3 text-xs"
//           >
//             <ImageIcon className="h-3.5 w-3.5" /> Add Image
//           </Button>
//         </div>

//         {/* RIGHT */}
//         <div className="flex items-center justify-end">
//           <Button
//             size="sm"
//             variant="destructive"
//             className="h-8 text-xs px-3"
//             onClick={handleDeleteSelected}
//           >
//             <Trash2 className="h-3 w-3 mr-2" />{" "}
//             {selectedId ? "Delete" : "Clear All"}
//           </Button>
//         </div>
//       </header>

//       {/* SECONDARY TOOLBAR */}
//       <div
//         className={`
//             absolute top-18 left-[50%] translate-x-[-50%] bg-gray-50/95 backdrop-blur-sm border-b shadow-sm z-20 
//             flex items-center justify-center gap-2 p-2 
//             rounded-lg
//             transition-all duration-300 ease-in-out
//             ${
//               selectedId && !isClosingToolbar
//                 ? "translate-y-0 opacity-100"
//                 : "-translate-y-full opacity-0 pointer-events-none"
//             }
//         `}
//       >
//         {selectedObject?.type === "text" && (
//           <>
//             <Select
//               value={selectedObject.fontFamily}
//               onValueChange={(val) => updateSelected({ fontFamily: val })}
//             >
//               <SelectTrigger className="w-27.5 h-8 text-xs border-dashed bg-white">
//                 <SelectValue placeholder="Font" />
//               </SelectTrigger>
//               <SelectContent>
//                 {FONTS.map((f) => (
//                   <SelectItem key={f} value={f}>
//                     {f}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
//               <Type className="h-3 w-3 text-gray-400" />
//               <input
//                 type="number"
//                 value={selectedObject.fontSize}
//                 onChange={(e) =>
//                   updateSelected({ fontSize: Number(e.target.value) })
//                 }
//                 className="w-8 text-xs text-center outline-none bg-transparent"
//               />
//             </div>
//             <ColorPicker
//               value={selectedObject.color}
//               onChange={(val) => updateSelected({ color: val })}
//               title="Text Color"
//             />
//             <div className="h-6 w-px bg-gray-300 mx-1"></div>
//             <div className="flex items-center bg-gray-100 p-0.5 rounded-md border gap-0.5">
//               <Button
//                 size="icon"
//                 variant={selectedObject.isBold ? "outline" : "ghost"}
//                 className="h-7 w-7 rounded-sm"
//                 onClick={() =>
//                   updateSelected({ isBold: !selectedObject.isBold })
//                 }
//               >
//                 <Bold className="h-3.5 w-3.5" />
//               </Button>
//               <Button
//                 size="icon"
//                 variant={selectedObject.isItalic ? "outline" : "ghost"}
//                 className="h-7 w-7 rounded-sm"
//                 onClick={() =>
//                   updateSelected({ isItalic: !selectedObject.isItalic })
//                 }
//               >
//                 <Italic className="h-3.5 w-3.5" />
//               </Button>
//               <Button
//                 size="icon"
//                 variant={selectedObject.isUnderline ? "outline" : "ghost"}
//                 className="h-7 w-7 rounded-sm"
//                 onClick={() =>
//                   updateSelected({ isUnderline: !selectedObject.isUnderline })
//                 }
//               >
//                 <Underline className="h-3.5 w-3.5" />
//               </Button>
//             </div>
//           </>
//         )}

//         {selectedObject?.type === "rect" && (
//           <>
//             <div className="flex items-center gap-2 mr-2">
//               <span className="text-[10px] uppercase font-bold text-gray-400">
//                 Fill
//               </span>
//               <ColorPicker
//                 value={selectedObject.fillColor}
//                 onChange={(val) => updateSelected({ fillColor: val })}
//                 title="Fill Color"
//                 allowTransparent
//               />
//             </div>
//             <div className="h-6 w-px bg-gray-300 mx-1"></div>
//             <div className="flex items-center gap-2 mr-2">
//               <span className="text-[10px] uppercase font-bold text-gray-400">
//                 Border
//               </span>
//               <ColorPicker
//                 value={selectedObject.strokeColor}
//                 onChange={(val) => updateSelected({ strokeColor: val })}
//                 title="Stroke Color"
//                 allowTransparent
//               />
//               <input
//                 type="number"
//                 min={0}
//                 value={selectedObject.strokeWidth}
//                 onChange={(e) =>
//                   updateSelected({ strokeWidth: Number(e.target.value) })
//                 }
//                 className="w-8 h-8 text-xs text-center border rounded-md"
//                 title="Stroke Width"
//               />
//             </div>
//             <div className="h-6 w-px bg-gray-300 mx-1"></div>
//             <div className="flex items-center gap-2">
//               <Circle className="h-3.5 w-3.5 text-gray-500" />
//               <input
//                 type="number"
//                 min={0}
//                 value={selectedObject.borderRadius}
//                 onChange={(e) =>
//                   updateSelected({ borderRadius: Number(e.target.value) })
//                 }
//                 className="w-10 h-8 text-xs text-center border rounded-md"
//                 title="Border Radius"
//               />
//             </div>
//             <div className="h-6 w-px bg-gray-300 mx-1"></div>
//             <div className="flex items-center gap-2">
//               <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
//                 <MoveVertical className="h-3 w-3 text-gray-400" />
//                 <input
//                   type="number"
//                   value={selectedObject.width}
//                   onChange={(e) =>
//                     updateSelected({
//                       width: Math.round(Number(e.target.value)),
//                     })
//                   }
//                   className="w-12 text-xs text-center outline-none bg-transparent"
//                 />
//               </div>
//               <div className="flex items-center h-8 border rounded-md px-2 bg-white gap-2">
//                 <MoveVertical className="h-3 w-3 text-gray-400 rotate-90" />
//                 <input
//                   type="number"
//                   value={selectedObject.height}
//                   onChange={(e) =>
//                     updateSelected({
//                       height: Math.round(Number(e.target.value)),
//                     })
//                   }
//                   className="w-12 text-xs text-center outline-none bg-transparent"
//                 />
//               </div>
//             </div>
//           </>
//         )}

//         <Button
//           variant="ghost"
//           size="icon"
//           className="h-8 w-8 ml-2 text-gray-500 hover:text-red-500 hover:bg-red-50"
//           onClick={handleCloseToolbar}
//         >
//           <X className="h-4 w-4" />
//         </Button>
//       </div>

//       {/* WORKSPACE */}
//       <main
//         ref={containerRef}
//         onMouseDown={handleContainerMouseDown}
//         className={`flex-1 relative overflow-auto bg-gray-50 no-scrollbar z-10 ${
//           tool === "hand"
//             ? "cursor-grab"
//             : tool === "draw-rect"
//             ? "cursor-crosshair"
//             : "cursor-default"
//         }`}
//       >
//         <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
//         <div
//           className="flex items-center justify-center min-w-full min-h-full bg-wrapper"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
//             backgroundSize: "20px 20px",
//             padding: "80px",
//             width: `${Math.max(100, (width * zoom[0]) / 100 + 160)}px`,
//             height: `${Math.max(100, (height * zoom[0]) / 100 + 160)}px`,
//           }}
//         >
//           <ContextMenu>
//             <ContextMenuTrigger>
//               <div
//                 className="relative shadow-xl border border-gray-200"
//                 style={{
//                   width: `${width * (zoom[0] / 100)}px`,
//                   height: `${height * (zoom[0] / 100)}px`,
//                   transition: "none",
//                   backgroundColor: bgColor,
//                 }}
//               >
//                 <canvas
//                   ref={canvasRef}
//                   className="absolute top-0 left-0 w-full h-full pointer-events-none"
//                 />

//                 {/* OBJECTS LAYER */}
//                 <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
//                   {objects.map((obj) => {
//                     const commonProps = {
//                       key: obj.id,
//                       obj,
//                       zoom: zoom[0],
//                       isSelected: selectedId === obj.id,
//                       tool,
//                       setDragTarget,
//                       setSelectedId,
//                       setResizingTarget,
//                       setRotatingTarget,
//                       innerRef: (el: HTMLDivElement | null) =>
//                         (objRefs.current[obj.id] = el),
//                     };

//                     if (obj.type === "text") {
//                       return (
//                         <TextItem {...commonProps} onUpdate={updateObject} />
//                       );
//                     }
//                     if (obj.type === "rect") {
//                       return <RectItem {...commonProps} />;
//                     }
//                     return null;
//                   })}
//                   {/* DRAWING PREVIEW */}
//                   {tempRect && (
//                     <div
//                       style={{
//                         position: "absolute",
//                         left: `${tempRect.x * (zoom[0] / 100)}px`,
//                         top: `${tempRect.y * (zoom[0] / 100)}px`,
//                         width: `${tempRect.width * (zoom[0] / 100)}px`,
//                         height: `${tempRect.height * (zoom[0] / 100)}px`,
//                         border: `2px dashed #000`,
//                         opacity: 0.5,
//                       }}
//                     />
//                   )}
//                 </div>
//               </div>
//             </ContextMenuTrigger>
//             <ContextMenuContent>
//               <ContextMenuItem>Add Background</ContextMenuItem>
//             </ContextMenuContent>
//           </ContextMenu>
//         </div>
//       </main>

//       {/* FOOTER */}
//       <footer className="px-4 py-3 bg-white border-t flex items-center justify-end z-30 relative">
//         <div className="flex items-center gap-3 w-64">
//           <Slider
//             value={zoom}
//             onValueChange={setZoom}
//             min={10}
//             max={300}
//             step={1}
//             className="w-32"
//           />
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="outline"
//                 className="h-8 w-15 px-2 text-xs flex font-normal"
//               >
//                 {Math.round(zoom[0])}%{" "}
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-30">
//               {ZOOM_PRESETS.map((preset) => (
//                 <DropdownMenuItem
//                   key={preset}
//                   onClick={() => setZoom([preset])}
//                   className="text-xs justify-between"
//                 >
//                   {preset}%{" "}
//                   {Math.round(zoom[0]) === preset && (
//                     <Check className="h-3 w-3" />
//                   )}
//                 </DropdownMenuItem>
//               ))}
//               <DropdownMenuSeparator />
//               <DropdownMenuItem onClick={handleFit} className="text-xs">
//                 Fit to Screen
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </footer>
//     </div>
//   );
// }
