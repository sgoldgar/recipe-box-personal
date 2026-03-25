import { useState, useRef, useCallback, useEffect } from "react";
import supabase from "./utils/supabase";

export type Category =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "dessert"
  | "snack"
  | "drink"
  | "mealprep"
  | "side";

export type Cuisine =
  | "italian"
  | "thai"
  | "chinese"
  | "japanese"
  | "american"
  | "mexican"
  | "mediterranean"
  | "indian"
  | "other";

export interface Recipe {
  id: string;
  name: string;
  category: Category;
  cuisine: Cuisine;
  tags: string[];
  fileType: "image" | "pdf";
  fileData: string; // base64
  fileName: string;
  createdAt: number;
  notes?: string;
}

const CATEGORY_COLORS: Record<Category, string> = {
  breakfast: "#FFB347",
  lunch: "#87CEEB",
  dinner: "#DDA0DD",
  dessert: "#FFB6C1",
  snack: "#98FB98",
  drink: "#87CEFA",
  mealprep: "#c2db36ff",
  side: "#D8BFD8",
};

const CATEGORY_EMOJIS: Record<Category, string> = {
  breakfast: "🍳",
  lunch: "🥗",
  dinner: "🍽️",
  dessert: "🍰",
  snack: "🍿",
  drink: "🥤",
  mealprep: "🍱",
  side: "🥔",
};

const CUISINE_EMOJIS: Record<Cuisine, string> = {
  italian: "🍝",
  thai: "🥢",
  chinese: "🥡",
  japanese: "🍣",
  american: "🦅",
  mexican: "🌮",
  mediterranean: "🫒",
  indian: "🍛",
  other: "🌍",
};

// server functions
async function fetchRecipesFromServer(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    cuisine: d.cuisine,
    tags: d.tags ?? [],
    fileType: d.file_type as "image" | "pdf",
    fileData: d.file_data,
    fileName: d.file_name,
    createdAt: d.created_at,
    notes: d.notes ?? undefined,
  }));
}

async function createRecipeOnServer(recipe: Recipe): Promise<Recipe> {
  const payload: any = {
    name: recipe.name,
    category: recipe.category,
    cuisine: recipe.cuisine,
    tags: recipe.tags,
    file_type: recipe.fileType,
    file_data: recipe.fileData,
    file_name: recipe.fileName,
    created_at: recipe.createdAt ?? Date.now(),
    notes: recipe.notes ?? null,
  };

  const { data, error } = await supabase
    .from("recipes")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    category: data.category,
    cuisine: data.cuisine,
    tags: data.tags ?? [],
    fileType: data.file_type,
    fileData: data.file_data,
    fileName: data.file_name,
    createdAt: data.created_at,
    notes: data.notes ?? undefined,
  };
}

async function deleteRecipeOnServer(id: string) {
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}

// function loadRecipes(): Recipe[] {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// }

// function saveRecipes(recipes: Recipe[]) {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
// }

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [view, setView] = useState<"grid" | "upload" | "detail">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [filterCuisine, setFilterCuisine] = useState<Cuisine | "all">("all");
  const [filterTag, setFilterTag] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchRecipesFromServer()
      .then((data) => {
        if (mounted) setRecipes(data);
      })
      .catch((err) => {
        console.error(err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedRecipe = recipes.find((r) => r.id === selectedId) ?? null;

  const updateRecipes = (next: Recipe[]) => {
    setRecipes(next);
  };

  const deleteRecipe = async (id: string) => {
    try {
      await deleteRecipeOnServer(id);
      updateRecipes(recipes.filter((r) => r.id !== id));
      setView("grid");
      setSelectedId(null);
    } catch (err) {
      console.error(err);
      // optionally show UI feedback
    }
  };

  const filtered = recipes.filter((r) => {
    if (filterCat !== "all" && r.category !== filterCat) return false;
    if (filterCuisine !== "all" && r.cuisine !== filterCuisine) return false;
    if (
      filterTag &&
      !r.tags.some((t) => t.toLowerCase().includes(filterTag.toLowerCase()))
    )
      return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFBF5",
        fontFamily: "'Nunito', 'Quicksand', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Pacifico&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; font-family: inherit; }
        input, select, textarea { font-family: inherit; }
        .card-hover { transition: transform 0.18s, box-shadow 0.18s; }
        .card-hover:hover { transform: translateY(-4px) rotate(0.5deg); box-shadow: 0 12px 32px rgba(0,0,0,0.13); }
        .btn-bounce:active { transform: scale(0.96); }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #e0d0b8; border-radius: 3px; }
      `}</style>

      <Header
        onUpload={() => setView("upload")}
        onHome={() => {
          setView("grid");
          setSelectedId(null);
        }}
      />

      {view === "grid" && (
        <GridView
          recipes={filtered}
          allTags={Array.from(new Set(recipes.flatMap((r) => r.tags)))}
          filterCat={filterCat}
          setFilterCat={setFilterCat}
          filterCuisine={filterCuisine}
          setFilterCuisine={setFilterCuisine}
          filterTag={filterTag}
          setFilterTag={setFilterTag}
          search={search}
          setSearch={setSearch}
          onSelect={(id) => {
            setSelectedId(id);
            setView("detail");
          }}
          totalCount={recipes.length}
        />
      )}

      {view === "upload" && (
        <UploadView
          onSave={async (r) => {
            try {
              const created = await createRecipeOnServer(r);
              // prepend new recipe to local state
              updateRecipes([created, ...recipes]);
              setView("grid");
            } catch (err) {
              console.error(err);
              // optionally show UI feedback
            }
          }}
          onCancel={() => setView("grid")}
        />
      )}

      {view === "detail" && selectedRecipe && (
        <DetailView
          recipe={selectedRecipe}
          onBack={() => setView("grid")}
          onDelete={() => deleteRecipe(selectedRecipe.id)}
        />
      )}
    </div>
  );
}

function Header({
  onUpload,
  onHome,
}: {
  onUpload: () => void;
  onHome: () => void;
}) {
  return (
    <header
      style={{
        background: "#FF6B6B",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 72,
        boxShadow: "0 4px 0 #e05555",
      }}
    >
      <button
        onClick={onHome}
        style={{
          background: "none",
          border: "none",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 28 }}>📖</span>
        <span
          style={{
            fontFamily: "'Pacifico', cursive",
            fontSize: 26,
            color: "#fff",
            letterSpacing: 0.5,
          }}
        >
          Recipe Box
        </span>
      </button>
      <button
        onClick={onUpload}
        className="btn-bounce"
        style={{
          background: "#fff",
          color: "#FF6B6B",
          border: "none",
          borderRadius: 999,
          padding: "10px 22px",
          fontWeight: 800,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 3px 0 #e0c8c8",
        }}
      >
        <span style={{ fontSize: 18 }}>+</span> Add Recipe
      </button>
    </header>
  );
}

function GridView({
  recipes,
  allTags,
  filterCat,
  setFilterCat,
  filterCuisine,
  setFilterCuisine,
  filterTag,
  setFilterTag,
  search,
  setSearch,
  onSelect,
  totalCount,
}: {
  recipes: Recipe[];
  allTags: string[];
  filterCat: Category | "all";
  setFilterCat: (v: Category | "all") => void;
  filterCuisine: Cuisine | "all";
  setFilterCuisine: (v: Cuisine | "all") => void;
  filterTag: string;
  setFilterTag: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onSelect: (id: string) => void;
  totalCount: number;
}) {
  const inputStyle = {
    border: "2px solid #f0d9b8",
    borderRadius: 12,
    padding: "9px 14px",
    fontSize: 14,
    background: "#fff",
    color: "#333",
    outline: "none",
    width: "100%",
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Search + Filters */}
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "2px solid #f0d9b8",
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search recipes…"
          style={{ ...inputStyle, minWidth: 180, flex: 2 }}
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as Category | "all")}
          style={{ ...inputStyle, flex: 1, minWidth: 140 }}
        >
          <option value="all">All categories</option>
          {(
            [
              "breakfast",
              "lunch",
              "dinner",
              "dessert",
              "snack",
              "drink",
              "mealprep",
              "side",
            ] as Category[]
          ).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_EMOJIS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={filterCuisine}
          onChange={(e) => setFilterCuisine(e.target.value as Cuisine | "all")}
          style={{ ...inputStyle, flex: 1, minWidth: 140 }}
        >
          <option value="all">All cuisines</option>
          {(
            [
              "italian",
              "chinese",
              "thai",
              "japanese",
              "american",
              "mexican",
              "mediterranean",
              "indian",
              "other",
            ] as Cuisine[]
          ).map((c) => (
            <option key={c} value={c}>
              {CUISINE_EMOJIS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 120 }}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <p style={{ color: "#999", fontSize: 14, fontWeight: 600 }}>
          {recipes.length} of {totalCount} recipe{totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      {recipes.length === 0 ? (
        <EmptyState hasRecipes={totalCount > 0} />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} onClick={() => onSelect(r.id)} />
          ))}
        </div>
      )}
    </main>
  );
}

function RecipeCard({
  recipe,
  onClick,
}: {
  recipe: Recipe;
  onClick: () => void;
}) {
  const color = CATEGORY_COLORS[recipe.category];
  return (
    <button
      onClick={onClick}
      className="card-hover btn-bounce"
      style={{
        background: "#fff",
        border: `2px solid ${color}`,
        borderRadius: 20,
        overflow: "hidden",
        textAlign: "left",
        padding: 0,
        width: "100%",
        boxShadow: `0 4px 0 ${color}88`,
      }}
    >
      <div
        style={{
          height: 160,
          background: `${color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {recipe.fileType === "image" ? (
          <img
            src={recipe.fileData}
            alt={recipe.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 48 }}>📄</span>
            <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>
              PDF Recipe
            </span>
          </div>
        )}
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: color,
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {CATEGORY_EMOJIS[recipe.category]} {recipe.category}
        </span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <p
          style={{
            fontWeight: 800,
            fontSize: 16,
            color: "#333",
            marginBottom: 4,
            lineHeight: 1.3,
          }}
        >
          {recipe.name}
        </p>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
          {CUISINE_EMOJIS[recipe.cuisine]}{" "}
          {recipe.cuisine.charAt(0).toUpperCase() + recipe.cuisine.slice(1)}
        </p>
        {recipe.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {recipe.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                style={{
                  background: `${color}22`,
                  color: "#555",
                  borderRadius: 999,
                  padding: "2px 9px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                #{t}
              </span>
            ))}
            {recipe.tags.length > 3 && (
              <span style={{ fontSize: 12, color: "#aaa" }}>
                +{recipe.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function EmptyState({ hasRecipes }: { hasRecipes: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>
        {hasRecipes ? "🔍" : "🍳"}
      </div>
      <p
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#555",
          marginBottom: 8,
        }}
      >
        {hasRecipes ? "No matching recipes" : "Your recipe box is empty!"}
      </p>
      <p style={{ fontSize: 15, color: "#aaa" }}>
        {hasRecipes
          ? "Try adjusting your filters."
          : "Click  Add Recipe to get started."}
      </p>
    </div>
  );
}

function UploadView({
  onSave,
  onCancel,
}: {
  onSave: (r: Recipe) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("dinner");
  const [cuisine, setCuisine] = useState<Cuisine>("other");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (f: File) => {
      if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
        setError("Please upload an image (JPG, PNG, WEBP) or PDF file.");
        return;
      }
      setFile(f);
      setError("");
      const data = await fileToBase64(f);
      setPreview(data);
      if (!name) setName(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    },
    [name],
  );

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Please enter a recipe name.");
      return;
    }
    if (!file || !preview) {
      setError("Please upload a recipe image or PDF.");
      return;
    }
    const recipe: Recipe = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      cuisine,
      tags,
      notes,
      fileType: file.type === "application/pdf" ? "pdf" : "image",
      fileData: preview,
      fileName: file.name,
      createdAt: Date.now(),
    };
    onSave(recipe);
  };

  const inputStyle = {
    border: "2px solid #f0d9b8",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 15,
    background: "#fff",
    outline: "none",
    width: "100%",
    color: "#333",
  };

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          border: "2px solid #f0d9b8",
          padding: "2rem",
          boxShadow: "0 6px 0 #f0d9b8",
        }}
      >
        <h2
          style={{
            fontWeight: 800,
            fontSize: 24,
            color: "#FF6B6B",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>📝</span> New Recipe
        </h2>

        {/* Drop Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `3px dashed ${dragging ? "#FF6B6B" : "#f0d9b8"}`,
            borderRadius: 18,
            minHeight: 180,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            background: dragging ? "#fff5f5" : "#fffdf8",
            marginBottom: "1.5rem",
            overflow: "hidden",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          {preview ? (
            file?.type === "application/pdf" ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <div style={{ fontSize: 56 }}>📄</div>
                <p style={{ fontWeight: 700, color: "#555", marginTop: 8 }}>
                  {file.name}
                </p>
                <p style={{ fontSize: 13, color: "#aaa" }}>Click to replace</p>
              </div>
            ) : (
              <img
                src={preview}
                alt="preview"
                style={{ width: "100%", maxHeight: 260, objectFit: "cover" }}
              />
            )
          ) : (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
              <p style={{ fontWeight: 700, color: "#888", fontSize: 16 }}>
                Drop an image or PDF here
              </p>
              <p style={{ fontSize: 13, color: "#bbb", marginTop: 4 }}>
                or click to browse
              </p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recipe name *"
            style={inputStyle}
          />

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              style={{ ...inputStyle, appearance: "none" }}
            >
              {(
                [
                  "breakfast",
                  "lunch",
                  "dinner",
                  "dessert",
                  "snack",
                  "drink",
                ] as Category[]
              ).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_EMOJIS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value as Cuisine)}
              style={{ ...inputStyle, appearance: "none" }}
            >
              {(
                [
                  "italian",
                  "asian",
                  "american",
                  "mexican",
                  "mediterranean",
                  "french",
                  "indian",
                  "other",
                ] as Cuisine[]
              ).map((c) => (
                <option key={c} value={c}>
                  {CUISINE_EMOJIS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Add a tag (e.g. gluten-free)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={addTag}
                className="btn-bounce"
                style={{
                  background: "#FF6B6B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 18px",
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: "#FFF0D6",
                      color: "#c07800",
                      borderRadius: 999,
                      padding: "4px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    #{t}
                    <button
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#c07800",
                        fontWeight: 800,
                        fontSize: 14,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          {error && (
            <p style={{ color: "#e05555", fontWeight: 700, fontSize: 14 }}>
              ⚠️ {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                background: "#f5f0e8",
                border: "none",
                borderRadius: 14,
                padding: "13px",
                fontWeight: 800,
                fontSize: 15,
                color: "#888",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-bounce"
              style={{
                flex: 2,
                background: "#FF6B6B",
                border: "none",
                borderRadius: 14,
                padding: "13px",
                fontWeight: 800,
                fontSize: 16,
                color: "#fff",
                boxShadow: "0 4px 0 #e05555",
              }}
            >
              Save Recipe 🎉
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailView({
  recipe,
  onBack,
  onDelete,
}: {
  recipe: Recipe;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = CATEGORY_COLORS[recipe.category];

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#FF6B6B",
          fontWeight: 800,
          fontSize: 15,
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back to recipes
      </button>

      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          border: `2px solid ${color}`,
          overflow: "hidden",
          boxShadow: `0 6px 0 ${color}88`,
        }}
      >
        {/* File viewer */}
        <div
          style={{
            background: `${color}15`,
            minHeight: 340,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {recipe.fileType === "image" ? (
            <img
              src={recipe.fileData}
              alt={recipe.name}
              style={{ maxWidth: "100%", maxHeight: 480, objectFit: "contain" }}
            />
          ) : (
            <iframe
              src={recipe.fileData}
              title={recipe.name}
              style={{ width: "100%", height: 520, border: "none" }}
            />
          )}
        </div>

        <div style={{ padding: "1.75rem 2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: "1rem",
            }}
          >
            <div>
              <h1
                style={{
                  fontWeight: 800,
                  fontSize: 28,
                  color: "#333",
                  marginBottom: 6,
                }}
              >
                {recipe.name}
              </h1>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span
                  style={{
                    background: color,
                    color: "#fff",
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {CATEGORY_EMOJIS[recipe.category]} {recipe.category}
                </span>
                <span
                  style={{
                    background: "#f5f0e8",
                    color: "#777",
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {CUISINE_EMOJIS[recipe.cuisine]} {recipe.cuisine}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={recipe.fileData}
                download={recipe.fileName}
                style={{
                  background: "#f0f9ff",
                  color: "#0077cc",
                  border: "2px solid #b3daff",
                  borderRadius: 12,
                  padding: "8px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ⬇ Download
              </a>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    background: "#fff5f5",
                    color: "#cc3333",
                    border: "2px solid #ffb3b3",
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  🗑 Delete
                </button>
              ) : (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span
                    style={{ fontSize: 13, color: "#cc3333", fontWeight: 700 }}
                  >
                    Sure?
                  </span>
                  <button
                    onClick={onDelete}
                    style={{
                      background: "#cc3333",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "7px 13px",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      background: "#f5f0e8",
                      border: "none",
                      borderRadius: 10,
                      padding: "7px 13px",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#888",
                    }}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: "1rem",
              }}
            >
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    background: "#FFF0D6",
                    color: "#c07800",
                    borderRadius: 999,
                    padding: "4px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {recipe.notes && (
            <div
              style={{
                background: "#FFFBF0",
                border: "2px solid #f5e6b0",
                borderRadius: 14,
                padding: "1rem 1.25rem",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  color: "#c09000",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                📝 Notes
              </p>
              <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6 }}>
                {recipe.notes}
              </p>
            </div>
          )}

          <p style={{ fontSize: 12, color: "#ccc", marginTop: "1.25rem" }}>
            Added{" "}
            {new Date(recipe.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </main>
  );
}
