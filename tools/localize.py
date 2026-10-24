"""Apply reviewed presentation-only translations to the pinned upstream source."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORDS = {
    'Kâğıt Kart': '纸艺卡丁车', 'Nasıl yarışalım?': '怎么比赛？',
    'GRAND PRIX': '大奖赛', 'Tek Yarış': '单场比赛', 'Zamana Karşı': '计时赛',
    'Dört bölümlük kupa. Her yarış puan getirir.': '连续挑战四个章节，积累积分赢取奖杯。',
    'Bir bölüm seç, yedi rakibe karşı yarış.': '选择一个章节，与七位对手竞速。',
    'Tek başına, en iyi turunun hayaletine karşı.': '独自出发，挑战自己最快一圈的幽灵。',
    '4 bölüm': '4 个章节', 'puanlı': '积分赛', '1 bölüm': '1 个章节', '8 sürücü': '8 位车手',
    'hayalet': '幽灵', 'rekor': '纪录', 'İnce kâğıt': '薄纸', 'Defter kâğıdı': '笔记本纸', 'Karton': '卡纸',
    'Sakin hız, bol düşünme payı.': '轻松起步，悠闲享受沿途风景。',
    'Asıl yarış burada başlıyor.': '恰到好处，真正的比赛从此开始。',
    'Çok hızlı, hiç affetmez.': '全速冲刺，考验每一次过弯。',
    'Başlamak için dokun': '按 Enter 或点击开始', 'Kâğıt Kart: başlamak için dokun': '纸艺卡丁车：点击开始',
    'Mod': '模式', 'Gramaj': '纸张', 'Sürücü': '车手', 'Bölüm': '章节', 'Geri': '返回', 'Seç': '选择',
    'Ayarlar': '设置', 'Kontroller': '操作说明', 'Kâğıt gramajı': '纸张重量', 'Hız sınıfı': '速度等级',
    'Sürücünü seç': '选择你的车手', 'Sürücü kartı': '车手资料', 'Bölüm seç': '选择章节',
    'Rekor': '最佳纪录', 'En iyi tur': '最快单圈', 'Kitabın ayarları': '这本书的设置', 'Geç': '跳过',
    'Hız': '速度', 'İvme': '加速', 'Yol tutuş': '操控', 'Ağırlık': '重量', 'Arazi': '越野',
    'Açık': '开启', 'Kapalı': '关闭', 'Müzik': '音乐', 'Efektler': '音效', 'Ses': '声音',
    'Görüntü': '画质', 'Otomatik': '自动', 'Yüksek': '高', 'Orta': '中', 'Düşük': '低', 'En düşük': '最低',
    'Hareketi azalt': '减少动态效果', 'Sistem': '跟随系统', 'Kamera sarsıntısı': '镜头震动',
    'Dokunmatik tuşlar': '触控按键', 'Otomatik gaz': '自动加速', 'FPS göster': '显示帧率',
    'Direksiyon': '转向', ' ya da ': ' 或 ', 'Gaz': '加速', 'Fren · geri': '刹车 / 倒车',
    'Drift · zıpla': '漂移 / 跳跃', ' basılı tut + yön': ' 按住并转向', 'Eşya': '道具',
    ' · geriye: ': ' · 向后投掷：', 'Geri bak': '向后看', 'Duraklat': '暂停',
    'Yeniden başla': '重新开始', ' (Zamana Karşı)': '（计时赛）', 'Sol çubuk ya da yön tuşları': '左摇杆或方向键',
    ' · geriye: fren + eşya': ' · 向后投掷：刹车 + 道具', 'Sol başparmağını sağa sola kaydır': '左手拇指左右滑动',
    'GAZ': '油门', ' basılı tut (ya da Oto gaz)': ' 按住（也可开启自动加速）', 'DRIFT': '漂移', 'EŞYA': '道具',
    ' ya da eşya penceresi': ' 或点击道具栏', 'FREN': '刹车', 'Üstteki ❚❚ düğmesi': '点击顶部 ❚❚ 按钮',
    'Klavye': '键盘', 'Oyun kolu': '手柄', 'Dokunmatik': '触控',
    'Devam': '继续比赛', 'Menüye dön': '返回主菜单', 'Mola': '休息一下', 'Duraklatıldı': '已暂停',
    'Kupa ilerlemen silinecek. Emin misin? Tekrar seç.': '将结束本次大奖赛。再次选择以确认。',
    'Grand Prix: yeniden başlarsan bu yarış puan vermez.': '大奖赛：重新开始后，本场比赛不计积分。',
    'Tur': '圈数', 'tur': '圈', 'Süre': '时间', 'En iyi': '最快', 'Toplam': '总计', 'Tekrar dene': '再次挑战',
    'Yeni rekor!': '新纪录！', 'Sıra': '名次', 'Puan': '积分', 'Puan tablosu': '积分榜',
    'Tekrar yarış': '再跑一场', 'Sonuçlar': '比赛成绩', 'Ödül törenine geç': '前往颁奖典礼',
    'Kupa sıralaması': '大奖赛积分榜', 'Kupa senin!': '奖杯属于你！', 'Podyumdasın!': '登上领奖台！',
    'Kupa tamamlandı': '大奖赛完成', 'Son bölüm · ödül töreni': '最终章 · 颁奖典礼',
    'Drift: ': '漂移：', 'Kıvılcım çıktı: ': '出现火花后：', ' bırak → turbo': ' 松开 → 涡轮加速',
    "Rampanın ucunda drift'e bas ": '在坡道边缘按漂移键 ', ' ile kullan, ': ' 使用，', ' geriye at': ' 向后投掷',
    'Yatay çevirirsen daha iyi': '横屏游玩，视野更开阔', 'Kapat': '关闭', 'İLK YARIŞ': '首次出发',
    'Nasıl sürülür?': '准备好出发了吗？',
    'Tarayıcında donanım hızlandırma kapalı görünüyor. Açarsan oyun çok daha akıcı olur (Ayarlar › Sistem › Donanım hızlandırma).': '当前浏览器未启用硬件加速，可在浏览器的“设置 › 系统”中开启以提高流畅度。',
    'Başla!': '出发！', 'Ters yön': '逆行', 'Bitiş!': '冲线！', 'Son tur': '最后一圈',
    'Harika çıkış!': '完美起步！', 'İyi çıkış': '漂亮起步', 'Motor boğuldu!': '起步过早！',
    'Roket Kalem': '火箭钢笔', 'Üçlü Roket': '三连火箭', 'Sakız': '泡泡糖', 'Kâğıt Uçak': '纸飞机',
    'Güdümlü Uçak': '追踪飞机', 'Mürekkep': '墨水', 'Yaldız': '金箔护盾', 'Makas': '剪刀',
}

def quoted_replace(text, mapping):
    for old, new in sorted(mapping.items(), key=lambda kv: -len(kv[0])):
        for quote in ("'", '"'):
            token = old.replace('\\', '\\\\').replace(quote, '\\' + quote)
            replacement = new.replace('\\', '\\\\').replace(quote, '\\' + quote)
            text = text.replace(quote + token + quote, quote + replacement + quote)
    return text

if __name__ == '__main__':
    for name in ('menus', 'forms', 'panels', 'hints', 'hud', 'touch', 'icons'):
        p = ROOT / f'src/ui/{name}.js'
        text = quoted_replace(p.read_text(encoding='utf8'), WORDS)
        text = text.replace('Bölüm ${', '章节 ${').replace('Sonraki bölüm: ${', '下一章：${')
        text = text.replace(' · adım 4/4', ' · 第 4 / 4 步').replace(' · Zamana Karşı`', ' · 计时赛`')
        text = text.replace('GRAND PRIX · ${', '大奖赛 · ${').replace(' bölüm sonrası', ' 章后')
        text = text.replace('Sen ${myPlace}. oldun · ${st[me] || 0} puan', '第 ${myPlace} 名 · ${st[me] || 0} 分')
        text = text.replace('${st[id] || 0} puan', '${st[id] || 0} 分').replace('${lap}. tur', '第 ${lap} 圈')
        text = text.replace('Diğer sürücüler bekleniyor · ${Math.ceil(race.waitLeft)} sn', '等待其他车手 · ${Math.ceil(race.waitLeft)} 秒')
        p.write_text(text, encoding='utf8')
    for name, title, subtitle in [
        ('meadow', '雏菊草原', '春日清晨，风车与溪流'),
        ('bosphorus', '海峡之夜', '穿越两座桥，从蓝调时刻驶入夜色'),
        ('glacier', '冰川隘口', '粉色晨光中的冰雪山口'),
        ('desk', '写字台', '驶出书页，探索桌上的奇妙世界'),
    ]:
        import re
        p = ROOT / f'src/track/defs/{name}.js'
        text = p.read_text(encoding='utf8')
        text = re.sub(r"  name: '[^']+'", f"  name: '{title}'", text, count=1)
        text = re.sub(r"  subtitle: '[^']+'", f"  subtitle: '{subtitle}'", text, count=1)
        p.write_text(text, encoding='utf8')
    p = ROOT / 'src/characters/characters.js'
    text = p.read_text(encoding='utf8')
    for old, new in [('Tarçın', '肉桂'), ('Nilüfer', '睡莲'), ('Paytak', '摇摇'), ('Pofuduk', '绒绒'), ('Kömür', '小煤球'), ('Pervane', '旋风'), ('Havuç', '胡萝卜'), ('Mürekkep', '墨墨')]:
        text = text.replace(f"name: '{old}'", f"name: '{new}'")
    p.write_text(text, encoding='utf8')
