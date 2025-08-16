import React from "react";
import { Card, Flex, Text, Badge, Tooltip } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Cpu, MemoryStick, HardDrive, AlertCircle, TrendingUp, TrendingDown, Gauge } from "lucide-react";
import Flag from "./Flag";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { Record } from "@/types/LiveData";
import { formatBytes } from "./Node";
import { getTrafficPercentage, getTrafficUsage } from "@/utils/formatHelper";

interface CompactCardProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
}

export const CompactCard: React.FC<CompactCardProps> = ({ basic, live, online }) => {
  const { t } = useTranslation();

  const defaultLive = {
    cpu: { usage: 0 },
    ram: { used: 0 },
    disk: { used: 0 },
    network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
    message: "",
  } as Record;

  const liveData = live || defaultLive;

  const memoryUsagePercent = basic.mem_total
    ? (liveData.ram.used / basic.mem_total) * 100
    : 0;
  const diskUsagePercent = basic.disk_total
    ? (liveData.disk.used / basic.disk_total) * 100
    : 0;

  const hasHighUsage = liveData.cpu.usage > 80 || memoryUsagePercent > 80 || diskUsagePercent > 80;

  return (
    <Link to={`/instance/${basic.uuid}`}>
      <Card
        className={`
          relative overflow-hidden transition-all duration-200 
          hover:shadow-md hover:bg-accent-2
          ${!online ? 'opacity-60' : ''}
          cursor-pointer p-3
        `}
      >
        <Flex justify="between" align="center" gap="3">
          {/* 左侧：节点信息 */}
          <Flex gap="2" align="center" className="flex-1 min-w-0">
            <Flag flag={basic.region} />
            <Flex direction="column" className="min-w-0">
              <Flex gap="2" align="center">
                <Text size="2" weight="bold" className="truncate">
                  {basic.name}
                </Text>
                {/* 价格和到期时间标签 */}
                <Flex gap="1" align="center">
                  {/* 价格标签 */}
                  {basic.price !== 0 && (
                    <Badge 
                      color="iris" 
                      variant="soft"
                      size="1"
                      className="text-[10px] px-1 py-0 whitespace-nowrap"
                    >
                      {basic.price === -1 ? t("common.free") : (() => {
                        const cycle = basic.billing_cycle;
                        let cycleText = '';
                        if (cycle >= 27 && cycle <= 32) cycleText = t("common.monthly");
                        else if (cycle >= 87 && cycle <= 95) cycleText = t("common.quarterly");
                        else if (cycle >= 175 && cycle <= 185) cycleText = t("common.semi_annual");
                        else if (cycle >= 360 && cycle <= 370) cycleText = t("common.annual");
                        else if (cycle >= 720 && cycle <= 750) cycleText = t("common.biennial");
                        else if (cycle >= 1080 && cycle <= 1150) cycleText = t("common.triennial");
                        else if (cycle === -1) cycleText = t("common.once");
                        else cycleText = `${cycle} ${t("nodeCard.time_day")}`;
                        return `${basic.currency || '￥'}${basic.price}/${cycleText}`;
                      })()}
                    </Badge>
                  )}
                  
                  {/* 到期时间标签 */}
                  {basic.expired_at && basic.price !== 0 && (
                    <Badge
                      color={(() => {
                        const expiredDate = new Date(basic.expired_at);
                        const now = new Date();
                        const diffTime = expiredDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 0 || diffDays <= 7) return "red";
                        if (diffDays <= 15) return "orange";
                        return "green";
                      })()}
                      variant="soft"
                      size="1"
                      className="text-[10px] px-1 py-0 whitespace-nowrap"
                    >
                      {(() => {
                        const expiredDate = new Date(basic.expired_at);
                        const now = new Date();
                        const diffTime = expiredDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays <= 0) return t("common.expired");
                        if (diffDays > 36500) return t("common.long_term");
                        return t("common.expired_in", { days: diffDays });
                      })()}
                    </Badge>
                  )}
                </Flex>
                {/* 自定义标签显示 */}
                {basic.tags && basic.tags.trim() && (
                  <Flex gap="1" align="center" className="hidden lg:flex">
                    {(() => {
                      const tags = basic.tags.split(';').filter(t => t.trim()).slice(0, 3); // 最多显示3个标签
                      
                      return tags.map((tag, index) => {
                        const trimmedTag = tag.trim();
                        if (!trimmedTag) return null;
                        
                        // 解析标签和颜色
                        const colorMatch = trimmedTag.match(/^(.+?)<([^>]+)>$/);
                        const tagText = colorMatch ? colorMatch[1] : trimmedTag;
                        const tagColor = (colorMatch ? colorMatch[2] : 'blue') as any;
                        
                        return (
                          <Badge 
                            key={index}
                            color={tagColor} 
                            variant="soft"
                            size="1"
                            className="text-[10px] px-1 py-0 whitespace-nowrap"
                          >
                            {tagText}
                          </Badge>
                        );
                      });
                    })()}
                  </Flex>
                )}
              </Flex>
              <Text size="1" color="gray">
                {basic.os} • {basic.arch}
              </Text>
            </Flex>
          </Flex>

          {/* 中间：资源使用情况（横向排列） */}
          <Flex gap="4" align="center" className="hidden md:flex">
            {/* CPU */}
            <Flex gap="1" align="center">
              <Cpu size={14} className="text-accent-10" />
              <Text size="1" weight="medium" style={{ 
                color: liveData.cpu.usage > 80 ? '#ef4444' : 'inherit' 
              }}>
                {liveData.cpu.usage.toFixed(0)}%
              </Text>
            </Flex>

            {/* 内存 */}
            <Flex gap="1" align="center">
              <MemoryStick size={14} className="text-accent-10" />
              <Text size="1" weight="medium" style={{ 
                color: memoryUsagePercent > 80 ? '#ef4444' : 'inherit' 
              }}>
                {memoryUsagePercent.toFixed(0)}%
              </Text>
            </Flex>

            {/* 磁盘 */}
            <Flex gap="1" align="center">
              <HardDrive size={14} className="text-accent-10" />
              <Text size="1" weight="medium" style={{ 
                color: diskUsagePercent > 80 ? '#ef4444' : 'inherit' 
              }}>
                {diskUsagePercent.toFixed(0)}%
              </Text>
            </Flex>

            {/* 负载 Load */}
            <Flex gap="1" align="center">
              <Gauge size={14} className="text-accent-10" />
              <Text size="1" weight="medium" style={{ 
                color: liveData.load?.load1 > 4 ? '#ef4444' : 'inherit' 
              }}>
                {liveData.load?.load1?.toFixed(2) || '0.00'}
              </Text>
            </Flex>

            {/* 网络 - 分开显示上下行 */}
            <Flex direction="column" gap="0">
              <Flex gap="1" align="center">
                <TrendingUp size={12} className="text-green-500" />
                <Text size="1" weight="medium">
                  {formatBytes(liveData.network.up)}/s
                </Text>
              </Flex>
              <Flex gap="1" align="center">
                <TrendingDown size={12} className="text-blue-500" />
                <Text size="1" weight="medium">
                  {formatBytes(liveData.network.down)}/s
                </Text>
              </Flex>
            </Flex>

            {/* 总流量 */}
            <Flex direction="column" gap="0">
              <Text size="1" color="gray">
                Total
              </Text>
              {Number(basic.traffic_limit) > 0 && basic.traffic_limit_type ? (
                <Flex direction="column" gap="0">
                  {/* 流量限制使用情况 */}
                  <Text size="1" weight="medium" style={{ 
                    color: (() => {
                      const percentage = getTrafficPercentage(
                        liveData.network.totalUp,
                        liveData.network.totalDown,
                        basic.traffic_limit,
                        basic.traffic_limit_type
                      );
                      if (percentage > 90) return '#ef4444';
                      if (percentage > 70) return '#f59e0b';
                      if (percentage > 50) return '#3b82f6';
                      return '#10b981';
                    })()
                  }}>
                    {formatBytes(getTrafficUsage(
                      liveData.network.totalUp,
                      liveData.network.totalDown,
                      basic.traffic_limit_type
                    ))}/{formatBytes(basic.traffic_limit || 0)}
                  </Text>
                  {/* 上下行总流量 */}
                  <Text size="1" color="gray" style={{ fontSize: '10px' }}>
                    ↑{formatBytes(liveData.network.totalUp)} ↓{formatBytes(liveData.network.totalDown)}
                  </Text>
                </Flex>
              ) : (
                <Text size="1" weight="medium">
                  ↑{formatBytes(liveData.network.totalUp)} ↓{formatBytes(liveData.network.totalDown)}
                </Text>
              )}
            </Flex>
          </Flex>

          {/* 右侧：状态和警告 */}
          <Flex gap="2" align="center">
            {liveData.message && (
              <Tooltip content={liveData.message}>
                <AlertCircle size={16} className="text-red-500 cursor-help" />
              </Tooltip>
            )}
            {hasHighUsage && online && (
              <Badge color="orange" variant="soft" size="1">
                High
              </Badge>
            )}
            <Badge 
              color={online ? "green" : "gray"} 
              variant="soft"
              size="1"
            >
              {online ? t("nodeCard.online") : t("nodeCard.offline")}
            </Badge>
          </Flex>
        </Flex>

        {/* 移动端：底部显示资源使用情况 */}
        <Flex gap="3" align="center" wrap="wrap" className="md:hidden mt-2 pt-2 border-t border-accent-4">
          <Text size="1" color="gray">
            CPU: {liveData.cpu.usage.toFixed(0)}%
          </Text>
          <Text size="1" color="gray">
            RAM: {memoryUsagePercent.toFixed(0)}%
          </Text>
          <Text size="1" color="gray">
            Disk: {diskUsagePercent.toFixed(0)}%
          </Text>
          <Text size="1" color="gray">
            Load: {liveData.load?.load1?.toFixed(2) || '0.00'}
          </Text>
          <Text size="1" color="gray">
            ↑ {formatBytes(liveData.network.up)}/s
          </Text>
          <Text size="1" color="gray">
            ↓ {formatBytes(liveData.network.down)}/s
          </Text>
          {Number(basic.traffic_limit) > 0 && basic.traffic_limit_type ? (
            <>
              <Text size="1" style={{ 
                color: (() => {
                  const percentage = getTrafficPercentage(
                    liveData.network.totalUp,
                    liveData.network.totalDown,
                    basic.traffic_limit,
                    basic.traffic_limit_type
                  );
                  if (percentage > 90) return '#ef4444';
                  if (percentage > 70) return '#f59e0b';
                  if (percentage > 50) return '#3b82f6';
                  return '#10b981';
                })()
              }}>
                Traffic: {getTrafficPercentage(
                  liveData.network.totalUp,
                  liveData.network.totalDown,
                  basic.traffic_limit,
                  basic.traffic_limit_type
                ).toFixed(0)}% ({formatBytes(getTrafficUsage(
                  liveData.network.totalUp,
                  liveData.network.totalDown,
                  basic.traffic_limit_type
                ))}/{formatBytes(basic.traffic_limit || 0)})
              </Text>
              <Text size="1" color="gray">
                Total: ↑{formatBytes(liveData.network.totalUp)} ↓{formatBytes(liveData.network.totalDown)}
              </Text>
            </>
          ) : (
            <Text size="1" color="gray">
              Total: ↑{formatBytes(liveData.network.totalUp)} ↓{formatBytes(liveData.network.totalDown)}
            </Text>
          )}
        </Flex>
      </Card>
    </Link>
  );
};