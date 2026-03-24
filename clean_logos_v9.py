from PIL import Image
import os
from collections import deque, Counter

INPUT_DIR = r"c:\Users\Admin\Desktop\Proyectos\NodoQuant\public\brokers"
OUTPUT_DIR = r"c:\Users\Admin\Desktop\Proyectos\NodoQuant\public\logos-v9"
TOLERANCE = 180
MIN_ISLAND_SIZE = 500

os.makedirs(OUTPUT_DIR, exist_ok=True)

def dist(c1, c2):
    return sum((a-b)**2 for a,b in zip(c1[:3], c2[:3]))**0.5

def process_logo(src, dst):
    img = Image.open(src).convert("RGBA")
    data = img.load()
    width, height = img.size
    
    # 1. Sample border to find the dominant background color
    borders = []
    for x in range(width):
        borders.append(data[x, 0][:3])
        borders.append(data[x, height-1][:3])
    for y in range(height):
        borders.append(data[0, y][:3])
        borders.append(data[width-1, y][:3])
    bg_color, _ = Counter(borders).most_common(1)[0]
    
    # 2. Flood fill from ALL border pixels with high tolerance
    visited = [[False]*height for _ in range(width)]
    queue = deque()
    for x in range(width):
        for y in [0, height-1]:
            if not visited[x][y] and dist(data[x,y][:3], bg_color) < TOLERANCE:
                queue.append((x,y))
                visited[x][y] = True
    for y in range(height):
        for x in [0, width-1]:
            if not visited[x][y] and dist(data[x,y][:3], bg_color) < TOLERANCE:
                queue.append((x,y))
                visited[x][y] = True

    while queue:
        cx, cy = queue.popleft()
        data[cx, cy] = (0, 0, 0, 0)
        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
            nx, ny = cx+dx, cy+dy
            if 0<=nx<width and 0<=ny<height and not visited[nx][ny]:
                # If it's near background
                if dist(data[nx,ny][:3], bg_color) < TOLERANCE:
                    visited[nx][ny] = True
                    queue.append((nx,ny))

    # 3. Island removal (Despeckle)
    mask = [[False]*height for _ in range(width)]
    for x in range(width):
        for y in range(height):
            if data[x,y][3] > 0 and not mask[x][y]:
                island = []
                q = deque([(x,y)])
                mask[x][y] = True
                while q:
                    ix, iy = q.popleft()
                    island.append((ix, iy))
                    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                        nx, ny = ix+dx, iy+dy
                        if 0<=nx<width and 0<=ny<height and data[nx,ny][3]>0 and not mask[nx][ny]:
                            mask[nx][ny] = True
                            q.append((nx,ny))
                
                if len(island) < MIN_ISLAND_SIZE:
                    for ix, iy in island:
                        data[ix, iy] = (0, 0, 0, 0)

    # 4. Force remaining to WHITE
    for x in range(width):
        for y in range(height):
            if data[x,y][3] > 10: # Threshold for "is a pixel"
                data[x,y] = (255, 255, 255, 255) # Pure white, fully opaque where it existed
            else:
                data[x,y] = (0, 0, 0, 0)

    img.save(dst)

# Process current set of 6 logos
LOGOS = [
    "binance.png", "ftmo.png",
    "icmarket.png", "metatrader4.png", "metatrader5.png",
    "ninjatrader.png"
]

for l in LOGOS:
    src_p = os.path.join(INPUT_DIR, l)
    out_name = l.replace(".png", "-v9.png")
    if "icmarket" in l: out_name = "icmarkets-v9.png"
    dst_p = os.path.join(OUTPUT_DIR, out_name)
    if os.path.exists(src_p):
        process_logo(src_p, dst_p)
        print(f"Cleaned v9 (Despeckled): {out_name}")
