'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ChartDataset
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, TrendingUpDown, TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

// Define TypeScript interfaces
interface PriceHistoryDataPoint {
  date: string
  price: number
}

interface PriceHistoryStore {
  supermarketId: string
  data: PriceHistoryDataPoint[]
}

interface PriceHistorySummary {
  trend: 'UP' | 'DOWN' | 'STABLE' | null
  min: number | null
  avg: number | null
  max: number | null
  inflation: string | null
  samples: number
}

interface PriceHistoryResponse {
  ean: string
  createdAt: string
  summary: PriceHistorySummary
  history: PriceHistoryStore[]
}

interface PriceHistoryChartProps {
  history: PriceHistoryResponse
}

// Helper function to format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short'
  })
}

// Helper function to capitalize supermarket names
const formatSupermarketName = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function PriceHistoryChart({ history }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<ChartData<'line'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (history && history.history) {
      // Prepare data for Chart.js
      const datasets: ChartDataset<'line'>[] = []
      
      // Create a dataset for each supermarket
      history.history.forEach((store) => {
        const supermarketName = formatSupermarketName(store.supermarketId)
        
        // Map data points
        const dataPoints = store.data.map((point) => ({
          x: formatDate(point.date),
          y: point.price
        }))
        
        // Reverse to show chronological order (oldest first)
        dataPoints.reverse()
        
        datasets.push({
          label: supermarketName,
          data: dataPoints.map(point => point.y),
          borderColor: getSupermarketColor(store.supermarketId),
          backgroundColor: getSupermarketColor(store.supermarketId),
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: getSupermarketColor(store.supermarketId),
          tension: 0.2,
          fill: false
        })
      })
      
      // Add min/avg/max reference lines if available
      if (history.summary) {
        const { min, avg, max } = history.summary
        
        if (min !== null) {
          datasets.push({
            label: 'Precio Mínimo',
            data: Array(datasets[0]?.data?.length || 0).fill(min),
            borderColor: '#059669', // Emerald
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            yAxisID: 'y'
          })
        }
        
        if (avg !== null) {
          datasets.push({
            label: 'Precio Promedio',
            data: Array(datasets[0]?.data?.length || 0).fill(avg),
            borderColor: '#94a3b8', // Slate
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            yAxisID: 'y'
          })
        }
        
        if (max !== null) {
          datasets.push({
            label: 'Precio Máximo',
            data: Array(datasets[0]?.data?.length || 0).fill(max),
            borderColor: '#dc2626', // Red
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            yAxisID: 'y'
          })
        }
      }
      
      // Create labels from the first dataset (assuming all have same dates)
      const labels = datasets[0] 
        ? datasets[0].data.map((_, index) => {
            const firstStore = history.history[0]
            if (firstStore && firstStore.data[index]) {
              return formatDate(firstStore.data[firstStore.data.length - 1 - index].date)
            }
            return ''
          })
        : []
      
      setChartData({
        labels: labels.reverse(),
        datasets
      })
      
      setIsLoading(false)
    }
  }, [history])

  // Get color based on supermarket
  function getSupermarketColor(supermarketId: string) {
    const colors: Record<string, string> = {
      carrefour: '#2563EB', // Blue
      jumbo: '#10B981', // Emerald
      coto: '#8B5CF6', // Violet
      dia: '#F59E0B', // Amber
      // Default color
      default: '#64748B' // Slate
    }
    
    return colors[supermarketId] || colors.default
  }

  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#0F172A', // Midnight Blue
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'line'
        }
      },
      tooltip: {
        backgroundColor: '#0F172A', // Midnight Blue
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#0F172A',
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || ''
            if (context.parsed.y !== null) {
              label += ': $' + context.parsed.y.toFixed(0)
            }
            return label
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#E2E8F0' // Light gray
        },
        ticks: {
          color: '#0F172A' // Midnight Blue
        }
      },
      y: {
        grid: {
          color: '#E2E8F0' // Light gray
        },
        ticks: {
          color: '#0F172A', // Midnight Blue
          callback: function(value) {
            return '$' + value
          }
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="h-80">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    )
  }

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 mt-8">
        <div className="text-center py-12">
          <p className="text-text-secondary">No hay datos históricos de precios disponibles</p>
        </div>
      </div>
    )
  }

  // Get trend indicator component
  const getTrendIcon = () => {
    if (!history.summary || !history.summary.trend) return null
    
    switch (history.summary.trend) {
      case 'UP':
        return <TrendingUp className="w-5 h-5 text-red-500" />
      case 'DOWN':
        return <TrendingDown className="w-5 h-5 text-green-500" />
      case 'STABLE':
        return <TrendingUpDown className="w-5 h-5 text-slate-500" />
      default:
        return null
    }
  }

  // Get trend text
  const getTrendText = () => {
    if (!history.summary || !history.summary.trend) return 'Sin datos'
    
    switch (history.summary.trend) {
      case 'UP':
        return 'Tendencia al alza'
      case 'DOWN':
        return 'Tendencia a la baja'
      case 'STABLE':
        return 'Estable'
      default:
        return 'Sin datos'
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        {getTrendIcon()}
        <h2 className="text-lg font-semibold">Evolución de precios</h2>
        <span className="ml-2 text-sm text-text-secondary">{getTrendText()}</span>
      </div>
      
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Key indicators */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-800 mb-1">
            Precio Mínimo
          </p>
          <p className="text-xl font-bold text-green-800">
            {history.summary.min !== null ? `$${history.summary.min.toFixed(0)}` : 'N/A'}
          </p>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-800 mb-1">
            Precio Promedio
          </p>
          <p className="text-xl font-bold text-slate-800">
            {history.summary.avg !== null ? `$${history.summary.avg.toFixed(0)}` : 'N/A'}
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-800 mb-1">
            Precio Máximo
          </p>
          <p className="text-xl font-bold text-red-800">
            {history.summary.max !== null ? `$${history.summary.max.toFixed(0)}` : 'N/A'}
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-800 mb-1">
            Inflación
          </p>
          <p className="text-xl font-bold text-blue-800">
            {history.summary.inflation !== null ? `${history.summary.inflation}%` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}