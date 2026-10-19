/**
 * Bruno AI Gym Buddy — Claymorphism Canvas Chart Engine
 * High-performance, retina-crisp canvas charts with zero external dependencies.
 * Fully supports offline rendering and claymorphism aesthetics.
 */

export const ChartEngine = {
  /**
   * Helper to set up high-DPI crisp canvas
   */
  setupCanvas: (canvas) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.width || 300;
    const height = rect.height || canvas.height || 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width, height, dpr };
  },

  /**
   * Renders the Clay Donut Chart for Workout Distribution
   */
  renderDonutChart: (canvasId, data = [], centerText = { value: '0', label: 'Workouts' }) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = ChartEngine.setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 8;
    const innerRadius = outerRadius * 0.68;

    const total = data.reduce((acc, cur) => acc + (cur.value || 0), 0) || 1;
    let startAngle = -Math.PI / 2;

    // Default palette if item color is missing
    const defaultColors = ['#ff7470', '#9275f5', '#f5a623', '#38b284', '#3ba4e6'];

    data.forEach((item, idx) => {
      const sliceAngle = ((item.value || 0) / total) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;
      const color = item.color || defaultColors[idx % defaultColors.length];

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      // Soft fill
      ctx.fillStyle = color;
      ctx.fill();

      // Soft slice separation stroke
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Render center text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#2d2627';
    ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(centerText.value, centerX, centerY - 6);

    ctx.fillStyle = '#7e7374';
    ctx.font = '600 10px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText((centerText.label || '').toUpperCase(), centerX, centerY + 14);
  },

  /**
   * Renders the Clay Smooth Curved Area Chart for User Growth
   */
  renderAreaChart: (canvasId, points = [], labels = []) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = ChartEngine.setupCanvas(canvas);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 24, bottom: 30, left: 36 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    if (!points || points.length === 0) {
      points = [0, 0, 0, 0, 0, 0, 0];
      labels = ['', '', '', '', '', '', ''];
    }

    const maxVal = Math.max(...points, 10);
    const roundedMax = Math.ceil(maxVal / 50) * 50 || 100;
    const yTicks = [0, Math.round(roundedMax / 3), Math.round((roundedMax * 2) / 3), roundedMax];

    // Draw horizontal grid lines & Y labels
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(235, 205, 205, 0.4)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aba0a1';
    ctx.font = '600 10px "Plus Jakarta Sans", system-ui, sans-serif';

    yTicks.forEach((tick) => {
      const y = padding.top + chartH - (tick / roundedMax) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      ctx.fillText(tick.toString(), padding.left - 8, y);
    });

    // Compute pixel coordinates for points
    const stepX = chartW / Math.max(points.length - 1, 1);
    const coords = points.map((val, i) => ({
      x: padding.left + i * stepX,
      y: padding.top + chartH - (val / roundedMax) * chartH,
    }));

    if (coords.length > 1) {
      // Create Gradient Fill
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(255, 116, 112, 0.35)');
      gradient.addColorStop(0.7, 'rgba(255, 116, 112, 0.12)');
      gradient.addColorStop(1, 'rgba(255, 116, 112, 0.0)');

      // Draw Curved Area
      ctx.beginPath();
      ctx.moveTo(coords[0].x, padding.top + chartH);
      ctx.lineTo(coords[0].x, coords[0].y);

      for (let i = 0; i < coords.length - 1; i++) {
        const xc = (coords[i].x + coords[i + 1].x) / 2;
        const yc = (coords[i].y + coords[i + 1].y) / 2;
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
      }
      ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
      ctx.lineTo(coords[coords.length - 1].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Curved Stroke Line
      ctx.beginPath();
      ctx.moveTo(coords[0].x, coords[0].y);
      for (let i = 0; i < coords.length - 1; i++) {
        const xc = (coords[i].x + coords[i + 1].x) / 2;
        const yc = (coords[i].y + coords[i + 1].y) / 2;
        ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
      }
      ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
      ctx.strokeStyle = '#ff7470';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw Points
      coords.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff7470';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#7e7374';
    ctx.font = '600 10px "Plus Jakarta Sans", system-ui, sans-serif';

    labels.forEach((label, i) => {
      const x = padding.left + i * stepX;
      ctx.fillText(label, x, padding.top + chartH + 8);
    });
  },

  /**
   * Renders a soft SVG Sparkline path for KPI cards
   */
  createSparklineSvg: (data = [10, 18, 14, 25, 22, 35, 30], color = '#ff7470') => {
    const width = 120;
    const height = 28;
    const min = Math.min(...data);
    const max = Math.max(...data) || 1;
    const range = max - min || 1;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    let d = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i]}`;
    }

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  },
};
