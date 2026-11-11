import rigby, math
E = 'ease_in_out'
# ---- idle: breathing + tiny head sway (3 s loop)
a = rigby.add_animation('idle', 3.0)
for t, s in [(0, 1.0), (1.5, 1.018), (3.0, 1.0)]: a.key('chest', 'scale', t, (1.0, s), E)
for t, r in [(0, 0), (0.75, 1.2), (2.25, -1.2), (3.0, 0)]: a.key('head', 'rotate', t, r, E)
for t, y in [(0, 0), (1.5, -6), (3.0, 0)]: pass
# ---- walk: 1 s cycle, feet lift alternately, hip bob, body sway, head counter-bob
w = rigby.add_animation('walk', 1.0)
N = 8
for i in range(N + 1):
    t = i / N; ph = 2 * math.pi * t
    for name, off in [('ik_foot_l', 0.0), ('ik_foot_r', math.pi)]:
        s = math.sin(ph + off)
        lift = max(0.0, s) * 22.0
        w.key(name, 'translate', t, (math.cos(ph + off) * 10.0, lift), 'linear')
    bob = abs(math.sin(ph)) * 22.0
    w.key('hip', 'translate', t, (math.sin(ph) * 4.0, -4.0 - bob * 0.25), 'linear')
    w.key('chest', 'rotate', t, math.sin(ph) * 2.2, 'linear')
    w.key('head', 'rotate', t, -math.sin(ph) * 1.8, 'linear')
# ---- run: 0.6 s cycle, bigger lift and lean
r = rigby.add_animation('run', 0.6)
for i in range(N + 1):
    t = 0.6 * i / N; ph = 2 * math.pi * i / N
    for name, off in [('ik_foot_l', 0.0), ('ik_foot_r', math.pi)]:
        s = math.sin(ph + off)
        r.key(name, 'translate', t, (math.cos(ph + off) * 30.0, max(0.0, s) * 55.0), 'linear')
    r.key('hip', 'translate', t, (math.sin(ph) * 8.0, -10.0 - abs(math.sin(ph)) * 14.0), 'linear')
    r.key('chest', 'rotate', t, math.sin(ph) * 4.0, 'linear')
    r.key('head', 'rotate', t, -math.sin(ph) * 3.0, 'linear')
print([x.name for x in rigby.animations()])
