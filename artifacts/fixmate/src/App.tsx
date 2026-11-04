import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, ArrowLeft, ArrowUpLeft, BadgeCheck, BriefcaseBusiness, Factory,
  CalendarDays, Check, CheckCircle2, ChevronLeft, CircleHelp, ClipboardList,
  Clock3, Fan, FileCheck2, Hammer, House,
  MapPin, Menu, Search, ShieldCheck, Star,
  PlugZap, Refrigerator, Tv, UserRound, Users, WashingMachine, Wrench, X, Zap,
} from 'lucide-react';
import { Form } from '@/components/ui/form';

type Role = 'customer' | 'technician' | 'admin';
type Status = 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
type Approval = 'pending' | 'approved' | 'rejected';
type ServiceCategory = { id: string; title: string; description: string; icon: string };
type Customer = { id: string; name: string; phone: string; state: string; city: string };
type Technician = {
  id: string; name: string; phone: string; email?: string; location: string;
  specialties: string[]; years: number; bio: string; approval: Approval;
};
type MaintenanceRequest = {
  id: string; customerId: string; customerName: string; phone: string; categoryId: string;
  description: string; state: string; city: string; appointment: string; status: Status;
  technicianId?: string; createdAt: string; declinedBy: string[];
};
type DemoState = {
  role: Role; customerId: string; technicianId: string;
  categories: ServiceCategory[]; customers: Customer[]; technicians: Technician[];
  requests: MaintenanceRequest[];
};

const STORAGE_KEY = 'fixmate-demo-v2';
const categoriesSeed: ServiceCategory[] = [
  { id: 'electrical', title: 'التركيبات والصيانة الكهربائية', description: 'تمديدات الكهرباء، إصلاح الأعطال، وفحص التوصيلات.', icon: 'zap' },
  { id: 'air-conditioning', title: 'صيانة أجهزة التكييف', description: 'فحص المكيفات وصيانتها وتحسين كفاءة التبريد.', icon: 'fan' },
  { id: 'refrigerators', title: 'الثلاجات والمجمدات', description: 'تشخيص أعطال الثلاجات والمجمدات وصيانتها.', icon: 'refrigerator' },
  { id: 'washing-machines', title: 'صيانة الغسالات', description: 'إصلاح الغسالات وتشخيص الأعطال الكهربائية والميكانيكية.', icon: 'washer' },
  { id: 'appliances', title: 'الأجهزة الكهربائية المنزلية', description: 'صيانة الأجهزة المنزلية الكهربائية بمختلف أنواعها.', icon: 'plug' },
  { id: 'electronics', title: 'الإلكترونيات والخدمات التقنية', description: 'تشخيص وصيانة الإلكترونيات والأجهزة التقنية.', icon: 'tv' },
  { id: 'metal-fabrication', title: 'الأعمال المعدنية والصيانة', description: 'تصنيع المعادن وأعمال اللحام والصيانة المعدنية.', icon: 'hammer' },
  { id: 'industrial-equipment', title: 'صيانة المعدات الصناعية', description: 'فحص وصيانة المعدات والأنظمة الصناعية.', icon: 'factory' },
];
const initialDemo: DemoState = {
  role: 'customer', customerId: 'c-1', technicianId: 't-1', categories: categoriesSeed,
  customers: [
    { id: 'c-1', name: 'سارة محمد', phone: '0912345678', state: 'ولاية الخرطوم', city: 'الخرطوم' },
    { id: 'c-2', name: 'عمر عبدالسلام', phone: '0923456789', state: 'ولاية الخرطوم', city: 'أم درمان' },
    { id: 'c-3', name: 'منى أحمد', phone: '0998765432', state: 'ولاية الجزيرة', city: 'ود مدني' },
  ],
  technicians: [
    { id: 't-1', name: 'معتز حسن', phone: '0911122233', email: 'moataz@example.sd', location: 'الخرطوم، بحري', specialties: ['electrical', 'appliances'], years: 8, bio: 'فني تركيبات كهربائية وصيانة أجهزة منزلية بخبرة عملية واهتمام بالسلامة.', approval: 'approved' },
    { id: 't-2', name: 'مصعب عثمان', phone: '0922233344', location: 'أم درمان', specialties: ['air-conditioning', 'refrigerators'], years: 6, bio: 'متخصص في صيانة أجهزة التكييف والثلاجات وتشخيص الأعطال بدقة.', approval: 'approved' },
    { id: 't-3', name: 'نهى إبراهيم', phone: '0991122334', location: 'الخرطوم', specialties: ['washing-machines', 'electronics'], years: 5, bio: 'متخصصة في صيانة الغسالات والأجهزة الإلكترونية والتقنية.', approval: 'approved' },
    { id: 't-4', name: 'طارق آدم', phone: '0905566778', location: 'ود مدني', specialties: ['metal-fabrication', 'industrial-equipment'], years: 4, bio: 'أعمال تصنيع معدني وصيانة معدات صناعية باهتمام بالتفاصيل.', approval: 'pending' },
  ],
  requests: [
    { id: 'FM-24018', customerId: 'c-1', customerName: 'سارة محمد', phone: '0912345678', categoryId: 'electrical', description: 'تركيب إنارة جديدة وفحص توصيلات غرفة المعيشة.', state: 'ولاية الخرطوم', city: 'الخرطوم', appointment: '2026-11-06', status: 'assigned', technicianId: 't-1', createdAt: '2026-11-03T09:15:00', declinedBy: [] },
    { id: 'FM-24017', customerId: 'c-2', customerName: 'عمر عبدالسلام', phone: '0923456789', categoryId: 'electrical', description: 'انقطاع متكرر في قاطع غرفة المعيشة.', state: 'ولاية الخرطوم', city: 'أم درمان', appointment: '2026-11-08', status: 'new', createdAt: '2026-11-03T13:40:00', declinedBy: [] },
    { id: 'FM-24016', customerId: 'c-1', customerName: 'سارة محمد', phone: '0912345678', categoryId: 'air-conditioning', description: 'المكيف يعمل لكن لا يبرد بالشكل المعتاد.', state: 'ولاية الخرطوم', city: 'الخرطوم', appointment: '2026-11-01', status: 'completed', technicianId: 't-2', createdAt: '2026-10-28T10:20:00', declinedBy: [] },
    { id: 'FM-24015', customerId: 'c-3', customerName: 'منى أحمد', phone: '0998765432', categoryId: 'washing-machines', description: 'الغسالة تصدر صوتاً مرتفعاً أثناء العصر.', state: 'ولاية الجزيرة', city: 'ود مدني', appointment: '2026-11-05', status: 'in_progress', technicianId: 't-3', createdAt: '2026-11-02T15:10:00', declinedBy: [] },
  ],
};

function safeLoad(): DemoState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialDemo;
    const parsed = JSON.parse(stored) as Partial<DemoState>;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.requests) || !Array.isArray(parsed.technicians) || !Array.isArray(parsed.customers)) return initialDemo;
    const validCategories = parsed.categories.every((item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.description === 'string' && typeof item.icon === 'string');
    const validCustomers = parsed.customers.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.phone === 'string');
    const validTechnicians = parsed.technicians.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.specialties) && typeof item.approval === 'string');
    const validRequests = parsed.requests.every((item) => item && typeof item.id === 'string' && typeof item.customerId === 'string' && typeof item.categoryId === 'string' && Array.isArray(item.declinedBy));
    if (!validCategories || !validCustomers || !validTechnicians || !validRequests) return initialDemo;
    return { ...initialDemo, ...parsed, role: ['customer', 'technician', 'admin'].includes(parsed.role || '') ? parsed.role as Role : 'customer' };
  } catch { return initialDemo; }
}
type StoreApi = { data: DemoState; setData: Dispatch<SetStateAction<DemoState>>; setRole: (role: Role) => void; updateRequest: (id: string, update: Partial<MaintenanceRequest>) => void };
const Store = createContext<StoreApi | null>(null);
function useStore() {
  const value = useContext(Store);
  if (!value) throw new Error('FixMate store is unavailable');
  return value;
}
function uid(prefix: string) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }
const statusLabels: Record<Status, string> = { new: 'طلب جديد', assigned: 'تم إسناد فني', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' };
const roleLabels: Record<Role, string> = { customer: 'حساب عميل تجريبي', technician: 'حساب فني تجريبي', admin: 'حساب مدير تجريبي' };
const statusColors: Record<Status, string> = { new: 'status-new', assigned: 'status-assigned', in_progress: 'status-progress', completed: 'status-complete', cancelled: 'status-cancelled' };
const iconMap: Record<string, LucideIcon> = { zap: Zap, fan: Fan, refrigerator: Refrigerator, washer: WashingMachine, plug: PlugZap, tv: Tv, hammer: Hammer, factory: Factory, wrench: Wrench };
function CategoryIcon({ name, size = 21 }: { name: string; size?: number }) {
  const Icon = iconMap[name] || Wrench;
  return <Icon size={size} strokeWidth={1.8} />;
}
function categoryTitle(data: DemoState, id: string) { return data.categories.find((item) => item.id === id)?.title || 'خدمة أخرى'; }
function StatusBadge({ status }: { status: Status }) { return <span className={`status-badge ${statusColors[status]}`} data-testid={`status-request-${status}`}>{statusLabels[status]}</span>; }

function Layout({ children }: { children: ReactNode }) {
  const { data, setRole } = useStore();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const dash = location.startsWith('/dashboard');
  const links = [
    { href: '/', label: 'الرئيسية' }, { href: '/services', label: 'الخدمات' },
    { href: '/request', label: 'طلب صيانة' }, { href: '/technician-register', label: 'انضم كفني' },
    { href: '/login', label: 'دخول تجريبي' },
  ];
  return <div className="min-h-[100dvh]">
    <div className="demo-banner"><ShieldCheck size={15} /><span>نسخة تجريبية — تغييراتك محفوظة محلياً في هذا المتصفح فقط، ولا يتم إرسال طلبات حقيقية.</span><span className="demo-dot">محاكاة</span></div>
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" data-testid="link-brand-home"><span className="brand-mark"><Wrench size={21} /></span><span>Fix<span>Mate</span><small>خدمات موثوقة، أقرب إليك</small></span></Link>
        <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="التنقل الرئيسي">
          {links.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={location === item.href ? 'nav-link active' : 'nav-link'} data-testid={`link-nav-${item.href.replace('/', '') || 'home'}`}>{item.label}</Link>)}
          {dash && <Link href={`/dashboard/${data.role}`} className="nav-link active" data-testid="link-dashboard">لوحة التحكم</Link>}
        </nav>
        <div className="header-actions">
          <label className="role-switch"><span>الدخول كـ</span><select aria-label="اختيار الحساب التجريبي" value={data.role} onChange={(event) => setRole(event.target.value as Role)} data-testid="select-demo-role"><option value="customer">عميل</option><option value="technician">فني</option><option value="admin">مدير</option></select></label>
          <Link href={`/dashboard/${data.role}`} className="button button-primary header-dashboard" data-testid="link-account">حسابي <ArrowLeft size={16} /></Link>
          <button className="icon-button mobile-menu" type="button" aria-label="فتح القائمة" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu"><Menu size={21} /></button>
        </div>
      </div>
    </header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-inner"><Link href="/" className="brand footer-brand"><span className="brand-mark"><Wrench size={18} /></span><span>Fix<span>Mate</span><small>رعاية أفضل لمساحتك</small></span></Link><p>منصة تجريبية لعرض تجربة خدمات الصيانة في السودان.</p><Link href="/request" className="footer-link" data-testid="link-footer-request">ابدأ بطلب تجريبي <ArrowLeft size={15} /></Link></div><div className="footer-bottom">جميع البيانات المعروضة تجريبية ومحفوظة على هذا الجهاز.</div></footer>
  </div>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>;
}
function CategoryCard({ category, href = '/services' }: { category: ServiceCategory; href?: string }) {
  return <Link href={href} className="category-card" data-testid={`card-category-${category.id}`}><span className="category-icon"><CategoryIcon name={category.icon} /></span><span className="category-copy"><strong>{category.title}</strong><small>{category.description}</small></span><ChevronLeft className="category-arrow" size={17} /></Link>;
}
function HomePage() {
  const { data } = useStore();
  const [search, setSearch] = useState('');
  const results = data.categories.filter((item) => item.title.includes(search) || item.description.includes(search));
  const featured = data.technicians.filter((person) => person.approval === 'approved').slice(0, 3);
  return <div className="page-enter">
    <section className="hero"><div className="hero-inner">
      <div className="hero-content"><div className="hero-kicker"><span className="kicker-line" /> عناية موثوقة لمنزلك في السودان</div><h1>الصيانة التي تحتاجها،<br /><em>بثقةٍ تستحقها.</em></h1><p>ابحث عن فني مؤهل لخدمات منزلك، وتابع طلبك خطوة بخطوة — في تجربة واضحة وبسيطة.</p>
        <div className="hero-search"><Search size={20} /><input aria-label="ابحث عن خدمة" placeholder="ما الخدمة التي تبحث عنها؟" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-home-search" /><Link href={search ? `/services?q=${encodeURIComponent(search)}` : '/request'} className="button button-accent" data-testid="button-hero-search">ابحث عن فني <ArrowLeft size={16} /></Link></div>
        <div className="hero-trust"><span><ShieldCheck size={17} /> فنيون بمراجعة الإدارة</span><span><Activity size={17} /> متابعة واضحة للطلب</span></div>
      </div>
      <div className="hero-visual" aria-label="رسم توضيحي لخدمات الصيانة"><div className="visual-grid" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="visual-core"><span className="core-ring"><Wrench size={47} /></span><span className="core-label">إصلاح • عناية • ثقة</span></div><div className="floating-service service-one"><span><Zap size={17} /></span> كهرباء <i /></div><div className="floating-service service-two"><span><Refrigerator size={17} /></span> ثلاجات <i /></div><div className="floating-service service-three"><span><Fan size={17} /></span> تكييف <i /></div><div className="visual-caption">FIXMATE / خدمة أقرب</div></div>
    </div><div className="hero-bottom"><span>حلول المنزل اليومية</span><span>الخرطوم · أم درمان · مدني</span><span>منصة محلية بمعايير واضحة</span></div></section>
    <section className="section-wrap categories-section"><div className="section-heading"><div><span className="eyebrow">اختر ما تحتاجه</span><h2>خدمات تجعل منزلك <span>أفضل حالاً</span></h2><p>مجموعة من خدمات الصيانة الأساسية، بترتيب واضح واختيار سهل.</p></div><Link href="/services" className="text-link" data-testid="link-all-services">عرض كل الخدمات <ArrowLeft size={16} /></Link></div><div className="category-grid">{(search ? results : data.categories.slice(0, 4)).map((category) => <CategoryCard key={category.id} category={category} />)}{search && results.length === 0 && <div className="empty-inline">لم نجد خدمة بهذا الاسم. جرّب كلمة أخرى.</div>}</div></section>
    <section className="how-section"><div className="section-wrap how-inner"><div className="how-intro"><span className="eyebrow eyebrow-light">بكل وضوح</span><h2>ثلاث خطوات،<br /><span>وراحة بال أكثر.</span></h2><p>تعرّف على آلية التجربة قبل أن تبدأ. هذه النسخة محاكاة محلية وليست خدمة حجز فعلية.</p><Link href="/request" className="button button-light" data-testid="button-how-request">جرّب إرسال طلب <ArrowLeft size={16} /></Link></div><div className="steps"><div className="step-item"><span className="step-number">01</span><div><h3>اختر الخدمة</h3><p>حدد نوع العطل وأضف وصفاً يساعد على فهم احتياجك.</p></div><Search size={21} /></div><div className="step-item"><span className="step-number">02</span><div><h3>تابع الإسناد</h3><p>يظهر طلبك في لوحة الإدارة، ويمكن لفني مؤهل قبوله.</p></div><Users size={21} /></div><div className="step-item"><span className="step-number">03</span><div><h3>راقب حالة الطلب</h3><p>تابع تغير الحالة من لوحة العميل في هذه التجربة.</p></div><CheckCircle2 size={21} /></div></div></div></section>
    <section className="section-wrap technicians-section"><div className="section-heading"><div><span className="eyebrow">شبكة فنيين تجريبية</span><h2>خبرة عملية، <span>وتعامل مهني.</span></h2><p>نماذج لملفات فنيين معتمدين داخل النسخة التجريبية.</p></div><Link href="/technician-register" className="text-link" data-testid="link-join-technicians">انضم كفني <ArrowLeft size={16} /></Link></div><div className="technician-grid">{featured.map((person, index) => <article className="technician-card" key={person.id} data-testid={`card-technician-${person.id}`}><div className="tech-card-top"><div className={`person-avatar avatar-${index}`}>{person.name.slice(0, 1)}</div><span className="verified"><BadgeCheck size={15} /> معتمد تجريبياً</span></div><h3>{person.name}</h3><p className="tech-loc"><MapPin size={14} /> {person.location}</p><div className="tech-specialties">{person.specialties.map((id) => <span key={id}>{categoryTitle(data, id)}</span>)}</div><div className="tech-meta"><span><BriefcaseBusiness size={14} /> {person.years} سنوات خبرة</span><span><Star size={14} fill="currentColor" /> ملف تجريبي</span></div></article>)}</div></section>
    <section className="request-cta"><div className="cta-mark"><Wrench size={25} /></div><div><span className="eyebrow eyebrow-light">ابدأ من هنا</span><h2>عندك عطل يحتاج اهتمام؟</h2><p>أنشئ طلباً تجريبياً وشاهد كيف ينتقل بين العميل والفني والإدارة.</p></div><Link href="/request" className="button button-accent" data-testid="button-cta-request">إنشاء طلب صيانة <ArrowLeft size={16} /></Link></section>
  </div>;
}

function ServicesPage() {
  const { data } = useStore();
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = useMemo(() => data.categories.filter((category) => `${category.title} ${category.description}`.includes(query.trim())), [data.categories, query]);
  const active = data.categories.find((item) => item.id === selected);
  return <div className="content-page page-enter"><PageIntro eyebrow="دليل الخدمات" title="خدمات الصيانة" text="استعرض الخدمات المتاحة في هذه التجربة، واختر الفئة المناسبة لوصف احتياجك." />
    <div className="service-tools"><label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن خدمة أو تخصص" aria-label="البحث في الخدمات" data-testid="input-service-search" />{query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث" data-testid="button-clear-service-search"><X size={16} /></button>}</label><span className="result-count">{filtered.length} خدمات</span></div>
    <div className="services-layout"><div className="service-list">{filtered.map((category) => <button type="button" key={category.id} onClick={() => setSelected(category.id)} className={`service-row ${selected === category.id ? 'selected' : ''}`} data-testid={`button-service-${category.id}`}><span className="category-icon"><CategoryIcon name={category.icon} /></span><span><strong>{category.title}</strong><small>{category.description}</small></span><ChevronLeft size={18} /></button>)}{filtered.length === 0 && <EmptyState title="لا توجد نتائج" text="لم نجد خدمة تطابق بحثك. جرب كلمات أبسط." icon={Search} />}</div>
      <aside className="service-detail">{active ? <><span className="detail-icon"><CategoryIcon name={active.icon} size={28} /></span><span className="eyebrow">تفاصيل الخدمة</span><h2>{active.title}</h2><p>{active.description} يمكنك وصف المشكلة بالتفصيل لتظهر في لوحة الإدارة ولدى الفنيين المعتمدين.</p><div className="detail-note"><ShieldCheck size={17} /><span>طلبات هذه النسخة تجريبية ومحفوظة محلياً.</span></div><Link href={`/request?category=${active.id}`} className="button button-primary full-button" data-testid="button-request-category">أنشئ طلباً تجريبياً <ArrowLeft size={16} /></Link></> : <div className="detail-placeholder"><div><CircleHelp size={26} /></div><h3>اختر خدمة لمعرفة المزيد</h3><p>تظهر هنا تفاصيل الفئة قبل إنشاء طلب الصيانة.</p></div>}</aside></div>
  </div>;
}

const requestSchema = z.object({
  name: z.string().min(2, 'يرجى إدخال الاسم كاملاً'),
  phone: z.string().min(9, 'أدخل رقم هاتف صحيحاً').max(15, 'رقم الهاتف طويل جداً'),
  categoryId: z.string().min(1, 'اختر نوع الخدمة'),
  description: z.string().min(12, 'يرجى وصف المشكلة في 12 حرفاً على الأقل'),
  state: z.string().min(2, 'أدخل الولاية'),
  city: z.string().min(2, 'أدخل المدينة أو الحي'),
  appointment: z.string().min(1, 'اختر موعداً مفضلاً'),
});
type RequestFormValues = z.infer<typeof requestSchema>;
function FieldError({ children }: { children?: string }) { return children ? <span className="field-error" role="alert">{children}</span> : null; }
function RequestPage() {
  const { data, setData } = useStore();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { name: '', phone: '', categoryId: new URLSearchParams(window.location.search).get('category') || '', description: '', state: 'ولاية الخرطوم', city: '', appointment: '' },
  });
  const onSubmit = (values: RequestFormValues) => {
    const customer = data.customers.find((item) => item.phone === values.phone) || { id: uid('c'), name: values.name, phone: values.phone, state: values.state, city: values.city };
    const requestId = `FM-${Math.floor(24019 + Math.random() * 700)}`;
    const item: MaintenanceRequest = { id: requestId, customerId: customer.id, customerName: values.name, phone: values.phone, categoryId: values.categoryId, description: values.description, state: values.state, city: values.city, appointment: values.appointment, status: 'new', createdAt: new Date().toISOString(), declinedBy: [] };
    setData((previous) => ({ ...previous, customers: previous.customers.some((entry) => entry.phone === customer.phone) ? previous.customers : [...previous.customers, customer], customerId: customer.id, requests: [item, ...previous.requests] }));
    setSubmitted(requestId);
    form.reset({ ...values });
  };
  return <div className="content-page page-enter"><PageIntro eyebrow="طلب جديد · نسخة تجريبية" title="أخبرنا بما يحتاجه منزلك" text="املأ التفاصيل لتظهر في لوحة العميل والإدارة والفنيين. لا يتم إرسال بياناتك إلى أي جهة." />
    {submitted ? <div className="success-panel" data-testid="success-request"><div className="success-check"><Check size={26} /></div><span className="eyebrow">تم حفظ الطلب محلياً</span><h2>طلبك التجريبي جاهز للمتابعة</h2><p>رقم الطلب <strong dir="ltr">{submitted}</strong> — يمكنك الآن مشاهدة الطلب في لوحة العميل أو تبديل الدور من الشريط العلوي.</p><div className="success-actions"><Link href="/dashboard/customer" className="button button-primary" data-testid="link-view-customer-request">عرض طلباتي <ArrowLeft size={16} /></Link><button type="button" className="button button-outline" onClick={() => setSubmitted(null)} data-testid="button-new-request">إنشاء طلب آخر</button></div></div> : <div className="form-layout"><div className="form-aside"><div className="form-aside-mark"><ClipboardList size={28} /></div><h2>تفاصيل أكثر،<br />تجربة أوضح.</h2><p>يتم استخدام بيانات النموذج في هذه النسخة لتوضيح دورة الطلب فقط، وتبقى داخل متصفحك.</p><div className="aside-points"><span><ShieldCheck size={17} /> ليس حجزاً حقيقياً</span><span><Clock3 size={17} /> حالة قابلة للتغيير</span><span><Users size={17} /> بيانات تجريبية محلية</span></div></div>
      <div className="form-card"><div className="form-card-head"><span className="eyebrow">بيانات الطلب</span><span className="required-note">الحقول المطلوبة <b>*</b></span></div>
        <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="form-grid" noValidate>
          <label className="form-field"><span>الاسم الكامل <b>*</b></span><input {...form.register('name')} placeholder="مثال: سارة محمد" data-testid="input-request-name" /><FieldError>{form.formState.errors.name?.message}</FieldError></label>
          <label className="form-field"><span>رقم الهاتف <b>*</b></span><input {...form.register('phone')} type="tel" dir="ltr" placeholder="09XXXXXXXX" data-testid="input-request-phone" /><FieldError>{form.formState.errors.phone?.message}</FieldError></label>
          <label className="form-field"><span>نوع الخدمة <b>*</b></span><select {...form.register('categoryId')} data-testid="select-request-category"><option value="">اختر الخدمة</option>{data.categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select><FieldError>{form.formState.errors.categoryId?.message}</FieldError></label>
          <label className="form-field"><span>الولاية <b>*</b></span><input {...form.register('state')} placeholder="مثال: ولاية الخرطوم" data-testid="input-request-state" /><FieldError>{form.formState.errors.state?.message}</FieldError></label>
          <label className="form-field"><span>المدينة أو الحي <b>*</b></span><input {...form.register('city')} placeholder="مثال: بحري، كافوري" data-testid="input-request-city" /><FieldError>{form.formState.errors.city?.message}</FieldError></label>
          <label className="form-field"><span>الموعد المفضل <b>*</b></span><input {...form.register('appointment')} type="date" data-testid="input-request-date" /><FieldError>{form.formState.errors.appointment?.message}</FieldError></label>
          <label className="form-field full-span"><span>وصف المشكلة <b>*</b></span><textarea {...form.register('description')} rows={4} placeholder="ما المشكلة؟ وأين تظهر؟ أضف أي تفاصيل تساعد على فهمها." data-testid="textarea-request-description" /><FieldError>{form.formState.errors.description?.message}</FieldError></label>
          <div className="form-footer full-span"><span><ShieldCheck size={16} /> لا توجد خدمات حقيقية في هذه النسخة.</span><button className="button button-primary" type="submit" disabled={form.formState.isSubmitting} data-testid="button-submit-request">حفظ الطلب التجريبي <ArrowLeft size={16} /></button></div>
        </form></Form>
      </div></div>}
  </div>;
}

const technicianSchema = z.object({
  name: z.string().min(2, 'يرجى إدخال الاسم الكامل'), phone: z.string().min(9, 'أدخل رقم هاتف صحيحاً'),
  email: z.string().email('أدخل بريداً صحيحاً').optional().or(z.literal('')),
  location: z.string().min(2, 'أدخل المدينة أو المنطقة'), specialties: z.array(z.string()).min(1, 'اختر تخصصاً واحداً على الأقل'),
  years: z.coerce.number().min(0, 'أدخل عدد سنوات صحيحاً').max(60, 'العدد غير منطقي'),
  bio: z.string().min(15, 'أضف نبذة لا تقل عن 15 حرفاً'),
});
type TechFormValues = z.infer<typeof technicianSchema>;
function TechnicianRegisterPage() {
  const { data, setData } = useStore();
  const [done, setDone] = useState(false);
  const form = useForm<TechFormValues>({ resolver: zodResolver(technicianSchema), defaultValues: { name: '', phone: '', email: '', location: '', specialties: [], years: 0, bio: '' } });
  const submit = (values: TechFormValues) => {
    const technician: Technician = { id: uid('t'), name: values.name, phone: values.phone, email: values.email || undefined, location: values.location, specialties: values.specialties, years: values.years, bio: values.bio, approval: 'pending' };
    setData((previous) => ({ ...previous, technicians: [...previous.technicians, technician], technicianId: technician.id, role: 'technician' }));
    setDone(true);
  };
  return <div className="content-page page-enter"><PageIntro eyebrow="انضم إلى شبكة FixMate" title="قدّم ملفك كفني" text="أنشئ ملفاً تجريبياً ليظهر طلب انضمامك في لوحة الإدارة للمراجعة." />
    {done ? <div className="success-panel"><div className="success-check"><FileCheck2 size={25} /></div><span className="eyebrow">تم حفظ الطلب</span><h2>ملفك بانتظار مراجعة الإدارة</h2><p>هذه مراجعة تجريبية فقط. بدّل إلى دور المدير من القائمة لمشاهدة الطلب والموافقة عليه أو رفضه.</p><Link href="/dashboard/technician" className="button button-primary" data-testid="link-tech-dashboard">عرض لوحة الفني <ArrowLeft size={16} /></Link></div> : <div className="form-card technician-form-card"><div className="form-card-head"><span className="eyebrow">معلومات مهنية</span><span className="required-note">تقديم تجريبي</span></div>
      <Form {...form}><form className="form-grid" onSubmit={form.handleSubmit(submit)} noValidate>
        <label className="form-field"><span>الاسم الكامل <b>*</b></span><input {...form.register('name')} placeholder="اسمك كما تحب أن يظهر" data-testid="input-tech-name" /><FieldError>{form.formState.errors.name?.message}</FieldError></label>
        <label className="form-field"><span>رقم الهاتف <b>*</b></span><input {...form.register('phone')} type="tel" dir="ltr" placeholder="09XXXXXXXX" data-testid="input-tech-phone" /><FieldError>{form.formState.errors.phone?.message}</FieldError></label>
        <label className="form-field"><span>البريد الإلكتروني</span><input {...form.register('email')} type="email" dir="ltr" placeholder="name@example.com" data-testid="input-tech-email" /><FieldError>{form.formState.errors.email?.message}</FieldError></label>
        <label className="form-field"><span>المدينة أو المنطقة <b>*</b></span><input {...form.register('location')} placeholder="مثال: الخرطوم، بحري" data-testid="input-tech-location" /><FieldError>{form.formState.errors.location?.message}</FieldError></label>
        <div className="form-field full-span"><span>التخصصات الفنية <b>*</b></span><div className="specialty-grid">{data.categories.map((category) => <label className="specialty-option" key={category.id}><input type="checkbox" value={category.id} {...form.register('specialties')} data-testid={`checkbox-tech-specialty-${category.id}`} /><span>{category.title}</span></label>)}</div><FieldError>{form.formState.errors.specialties?.message}</FieldError></div>
        <label className="form-field"><span>سنوات الخبرة <b>*</b></span><input {...form.register('years')} type="number" min="0" data-testid="input-tech-years" /><FieldError>{form.formState.errors.years?.message}</FieldError></label>
        <label className="form-field full-span"><span>نبذة عن خبرتك <b>*</b></span><textarea {...form.register('bio')} rows={4} placeholder="اذكر طبيعة الأعمال التي تتقنها..." data-testid="textarea-tech-bio" /><FieldError>{form.formState.errors.bio?.message}</FieldError></label>
        <div className="form-footer full-span"><span><ShieldCheck size={16} /> التسجيل لا يعني التحقق من الهوية أو المؤهلات.</span><button className="button button-primary" type="submit" data-testid="button-submit-tech-application">إرسال طلب الانضمام <ArrowLeft size={16} /></button></div>
      </form></Form>
    </div>}
  </div>;
}

function LoginPage() {
  const { setRole } = useStore();
  const [, navigate] = useLocation();
  const options: { role: Role; title: string; description: string; icon: LucideIcon; href: string }[] = [
    { role: 'customer', title: 'تجربة العميل', description: 'إنشاء الطلبات ومتابعة حالتها.', icon: House, href: '/dashboard/customer' },
    { role: 'technician', title: 'تجربة الفني', description: 'استعراض الطلبات وإدارة ملفك.', icon: Wrench, href: '/dashboard/technician' },
    { role: 'admin', title: 'تجربة الإدارة', description: 'مراجعة الطلبات والفنيين والعملاء.', icon: BriefcaseBusiness, href: '/dashboard/admin' },
  ];
  return <div className="content-page login-page page-enter"><PageIntro eyebrow="دخول تجريبي" title="اختر طريقة استكشافك" text="لا توجد حسابات أو كلمات مرور. هذه أدوار محاكاة للتنقل بين أجزاء تجربة FixMate." /><div className="role-cards">{options.map((option) => <button className="role-card" key={option.role} type="button" onClick={() => { setRole(option.role); navigate(option.href); }} data-testid={`button-login-${option.role}`}><span className="role-card-icon"><option.icon size={23} /></span><span><strong>{option.title}</strong><small>{option.description}</small></span><ArrowUpLeft size={18} /></button>)}</div><div className="notice-box"><ShieldCheck size={18} /><span>الدخول هنا لا ينشئ جلسة حقيقية. يتم حفظ الدور المختار على هذا الجهاز فقط.</span></div></div>;
}

function EmptyState({ title, text, icon: Icon = ClipboardList, action }: { title: string; text: string; icon?: LucideIcon; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={23} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}
function RequestCard({ request, children }: { request: MaintenanceRequest; children?: ReactNode }) {
  const { data } = useStore();
  return <article className="request-card" data-testid={`card-request-${request.id}`}><div className="request-card-head"><div className="request-card-category"><span className="mini-category-icon"><CategoryIcon name={data.categories.find((item) => item.id === request.categoryId)?.icon || 'wrench'} size={17} /></span><div><strong>{categoryTitle(data, request.categoryId)}</strong><small dir="ltr">{request.id}</small></div></div><StatusBadge status={request.status} /></div><p className="request-description">{request.description}</p><div className="request-facts"><span><MapPin size={15} /> {request.city}، {request.state}</span><span><CalendarDays size={15} /> {request.appointment || 'موعد مرن'}</span></div>{request.technicianId && <div className="assigned-row"><UserRound size={15} /> الفني المسند: <strong>{data.technicians.find((person) => person.id === request.technicianId)?.name || 'فني'}</strong></div>}{children}</article>;
}
function DashboardHeading({ eyebrow, title, sub, badge }: { eyebrow: string; title: string; sub: string; badge: string }) {
  return <div className="dashboard-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{sub}</p></div><span className="demo-account"><span className="account-dot" />{badge}</span></div>;
}
function CustomerDashboard() {
  const { data } = useStore();
  const customer = data.customers.find((item) => item.id === data.customerId) || data.customers[0];
  const requests = data.requests.filter((request) => request.customerId === customer?.id || request.phone === customer?.phone);
  const active = requests.filter((request) => !['completed', 'cancelled'].includes(request.status)).length;
  return <div className="dashboard-page page-enter"><DashboardHeading eyebrow="مساحة العميل" title={`مرحباً، ${customer?.name || 'بك'}`} sub="هذه لوحة متابعة تجريبية لطلبات الصيانة الخاصة بك." badge={roleLabels.customer} />
    <div className="dashboard-stats"><div className="stat-box"><span className="stat-icon"><ClipboardList size={18} /></span><span>إجمالي الطلبات</span><strong>{requests.length}</strong></div><div className="stat-box"><span className="stat-icon amber"><Activity size={18} /></span><span>طلبات قيد المتابعة</span><strong>{active}</strong></div><div className="stat-box"><span className="stat-icon mint"><CheckCircle2 size={18} /></span><span>طلبات مكتملة</span><strong>{requests.filter((request) => request.status === 'completed').length}</strong></div></div>
    <div className="dashboard-section-head"><div><h2>طلباتي</h2><p>تتغير الحالة بحسب إجراءات الفني أو الإدارة في النسخة التجريبية.</p></div><Link href="/request" className="button button-primary" data-testid="button-customer-new-request"><span>طلب صيانة جديد</span><ArrowLeft size={16} /></Link></div>
    {requests.length ? <div className="request-grid">{requests.map((request) => <RequestCard key={request.id} request={request} />)}</div> : <EmptyState title="لا توجد طلبات بعد" text="عندما تنشئ طلب صيانة تجريبياً، ستظهر تفاصيله هنا." action={<Link href="/request" className="button button-primary" data-testid="link-customer-empty-request">أنشئ أول طلب <ArrowLeft size={16} /></Link>} />}
  </div>;
}
function TechnicianDashboard() {
  const { data, setData, updateRequest } = useStore();
  const technician = data.technicians.find((person) => person.id === data.technicianId) || data.technicians.find((person) => person.approval === 'approved');
  if (!technician) return <div className="dashboard-page"><EmptyState title="لا يوجد ملف فني" text="أنشئ ملفاً تجريبياً ليظهر في لوحة الفني." action={<Link href="/technician-register" className="button button-primary" data-testid="link-tech-register-empty">إنشاء ملف فني</Link>} /></div>;
  const available = data.requests.filter((request) => request.status === 'new' && !request.declinedBy.includes(technician.id) && technician.specialties.includes(request.categoryId));
  const assigned = data.requests.filter((request) => request.technicianId === technician.id);
  const approvalTitle = technician.approval === 'approved' ? 'فني معتمد تجريبياً' : technician.approval === 'pending' ? 'طلبك قيد المراجعة' : 'تم رفض الطلب';
  return <div className="dashboard-page page-enter"><DashboardHeading eyebrow="مساحة الفني" title={`أهلاً، ${technician.name}`} sub="تابع الطلبات المتاحة وتعرّف على ملفك المهني." badge={roleLabels.technician} />
    <div className={`approval-notice approval-${technician.approval}`}><span className="approval-icon">{technician.approval === 'approved' ? <BadgeCheck size={21} /> : <Clock3 size={21} />}</span><div><strong>{approvalTitle}</strong><p>{technician.approval === 'approved' ? 'يمكنك قبول الطلبات الجديدة ضمن تخصصاتك أو إخفاؤها عنك.' : 'لا تظهر الطلبات إلا بعد موافقة المدير في النسخة التجريبية.'}</p></div>{technician.approval === 'pending' && <button className="button button-outline button-small" type="button" onClick={() => setData((previous) => ({ ...previous, role: 'admin' }))} data-testid="button-go-admin-review">مراجعة كمدير</button>}</div>
    <div className="profile-request-grid"><section className="profile-card"><div className="profile-card-top"><div className="person-avatar profile-avatar">{technician.name.slice(0, 1)}</div><span className={`approval-pill approval-pill-${technician.approval}`}>{technician.approval === 'approved' ? 'معتمد' : technician.approval === 'pending' ? 'قيد المراجعة' : 'مرفوض'}</span></div><h2>{technician.name}</h2><p className="tech-loc"><MapPin size={14} />{technician.location}</p><p className="profile-bio">{technician.bio}</p><div className="tech-specialties">{technician.specialties.map((id) => <span key={id}>{categoryTitle(data, id)}</span>)}</div><div className="profile-experience"><BriefcaseBusiness size={16} /> {technician.years} سنوات خبرة</div></section>
      <div className="technician-work"><div className="dashboard-section-head compact"><div><h2>طلبات مناسبة لك</h2><p>تختفي الطلبات التي ترفضها من قائمتك فقط.</p></div><span className="count-pill">{available.length} متاح</span></div>{technician.approval !== 'approved' ? <EmptyState title="بانتظار اعتماد الملف" text="بعد الموافقة التجريبية من الإدارة ستظهر الطلبات المناسبة لتخصصك." icon={Clock3} /> : available.length ? <div className="request-grid">{available.map((request) => <RequestCard key={request.id} request={request}><div className="request-actions"><button className="button button-primary button-small" type="button" onClick={() => updateRequest(request.id, { status: 'assigned', technicianId: technician.id })} data-testid={`button-accept-${request.id}`}><Check size={15} /> قبول الطلب</button><button className="button button-outline button-small" type="button" onClick={() => setData((previous) => ({ ...previous, requests: previous.requests.map((item) => item.id === request.id ? { ...item, declinedBy: [...item.declinedBy, technician.id] } : item) }))} data-testid={`button-decline-${request.id}`}>إخفاء عني</button></div></RequestCard>)}</div> : <EmptyState title="لا توجد طلبات مطابقة" text="ستظهر هنا الطلبات الجديدة في تخصصاتك. يمكنك تجربة إنشاء طلب كعميل." icon={ClipboardList} />}</div></div>
    <div className="dashboard-section-head assigned-heading"><div><h2>الطلبات المسندة إليك</h2><p>حدّث حالة العمل لتنعكس لدى العميل والإدارة.</p></div></div>
    {assigned.length ? <div className="request-grid">{assigned.map((request) => <RequestCard key={request.id} request={request}><div className="request-actions"><button className="button button-outline button-small" type="button" disabled={request.status === 'in_progress'} onClick={() => updateRequest(request.id, { status: 'in_progress' })} data-testid={`button-progress-${request.id}`}>بدء التنفيذ</button><button className="button button-primary button-small" type="button" disabled={request.status === 'completed'} onClick={() => updateRequest(request.id, { status: 'completed' })} data-testid={`button-complete-${request.id}`}><Check size={15} /> إكمال الطلب</button></div></RequestCard>)}</div> : <div className="small-empty">لا توجد طلبات مسندة إليك حالياً.</div>}
  </div>;
}

function AdminDashboard() {
  const { data, setData, updateRequest } = useStore();
  const [tab, setTab] = useState<'requests' | 'technicians' | 'customers' | 'services'>('requests');
  const [newCategory, setNewCategory] = useState('');
  const pending = data.technicians.filter((item) => item.approval === 'pending');
  const stats = [{ label: 'إجمالي الطلبات', value: data.requests.length, icon: ClipboardList }, { label: 'طلبات جديدة', value: data.requests.filter((item) => item.status === 'new').length, icon: Clock3 }, { label: 'فنيون معتمدون', value: data.technicians.filter((item) => item.approval === 'approved').length, icon: BadgeCheck }, { label: 'عملاء تجريبيون', value: data.customers.length, icon: Users }];
  const tabs = [{ id: 'requests', label: 'الطلبات', count: data.requests.length }, { id: 'technicians', label: 'طلبات الفنيين', count: pending.length }, { id: 'customers', label: 'العملاء', count: data.customers.length }, { id: 'services', label: 'الخدمات', count: data.categories.length }];
  return <div className="dashboard-page page-enter"><DashboardHeading eyebrow="مركز الإدارة" title="إدارة المنصة التجريبية" sub="نظرة شاملة على حركة الطلبات والملفات والخدمات." badge={roleLabels.admin} />
    <div className="admin-stats">{stats.map((stat) => <div className="admin-stat" key={stat.label}><span className="stat-icon"><stat.icon size={18} /></span><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div>
    <div className="admin-panel"><div className="admin-tabs" role="tablist" aria-label="أقسام الإدارة">{tabs.map((item) => <button type="button" className={tab === item.id ? 'admin-tab active' : 'admin-tab'} onClick={() => setTab(item.id as typeof tab)} key={item.id} role="tab" aria-selected={tab === item.id} data-testid={`tab-admin-${item.id}`}>{item.label}<span>{item.count}</span></button>)}</div>
      {tab === 'requests' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>رقم الطلب</th><th>العميل / الموقع</th><th>الخدمة</th><th>الحالة</th><th>الفني</th></tr></thead><tbody>{data.requests.map((request) => <tr key={request.id} data-testid={`row-admin-request-${request.id}`}><td><strong dir="ltr">{request.id}</strong><small>{new Date(request.createdAt).toLocaleDateString('ar')}</small></td><td><strong>{request.customerName}</strong><small>{request.city}، {request.state}</small></td><td>{categoryTitle(data, request.categoryId)}</td><td><select value={request.status} onChange={(event) => updateRequest(request.id, { status: event.target.value as Status })} aria-label={`حالة الطلب ${request.id}`} className={`table-status ${statusColors[request.status]}`} data-testid={`select-status-${request.id}`}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td>{data.technicians.find((person) => person.id === request.technicianId)?.name || '—'}</td></tr>)}</tbody></table>{!data.requests.length && <EmptyState title="لا توجد طلبات" text="طلبات العملاء الجديدة ستظهر في هذا الجدول." />}</div>}
      {tab === 'technicians' && <div className="admin-card-list">{data.technicians.map((person) => <div className="admin-person-row" key={person.id} data-testid={`row-admin-tech-${person.id}`}><div className="person-avatar small-avatar">{person.name.slice(0, 1)}</div><div className="admin-person-main"><strong>{person.name}</strong><small>{person.location} · {person.specialties.map((id) => categoryTitle(data, id)).join('، ')}</small><small>{person.phone} · {person.years} سنوات خبرة</small></div><span className={`approval-pill approval-pill-${person.approval}`}>{person.approval === 'approved' ? 'معتمد' : person.approval === 'pending' ? 'قيد المراجعة' : 'مرفوض'}</span>{person.approval === 'pending' && <div className="admin-row-actions"><button className="button button-primary button-small" type="button" onClick={() => setData((previous) => ({ ...previous, technicians: previous.technicians.map((item) => item.id === person.id ? { ...item, approval: 'approved' } : item) }))} data-testid={`button-approve-${person.id}`}><Check size={14} /> موافقة</button><button className="button button-danger-outline button-small" type="button" onClick={() => { if (window.confirm('هل تريد رفض طلب هذا الفني؟')) setData((previous) => ({ ...previous, technicians: previous.technicians.map((item) => item.id === person.id ? { ...item, approval: 'rejected' } : item) })); }} data-testid={`button-reject-${person.id}`}>رفض</button></div>}</div>)}{!data.technicians.length && <EmptyState title="لا توجد ملفات فنيين" text="طلبات الانضمام المقدمة ستظهر هنا." icon={Users} />}</div>}
      {tab === 'customers' && <div className="admin-card-list">{data.customers.map((customer) => <div className="admin-person-row" key={customer.id} data-testid={`row-admin-customer-${customer.id}`}><div className="person-avatar small-avatar customer-avatar">{customer.name.slice(0, 1)}</div><div className="admin-person-main"><strong>{customer.name}</strong><small dir="ltr">{customer.phone}</small><small>{customer.city}، {customer.state}</small></div><span className="customer-request-count">{data.requests.filter((request) => request.customerId === customer.id).length} طلب</span></div>)}{!data.customers.length && <EmptyState title="لا يوجد عملاء بعد" text="سيظهر العملاء بعد إنشاء طلب تجريبي." icon={Users} />}</div>}
      {tab === 'services' && <div className="admin-services"><div className="admin-card-list">{data.categories.map((category) => <div className="admin-service-row" key={category.id} data-testid={`row-admin-service-${category.id}`}><span className="category-icon"><CategoryIcon name={category.icon} size={18} /></span><div><strong>{category.title}</strong><small>{category.description}</small></div><button className="icon-button remove-category" type="button" aria-label={`حذف خدمة ${category.title}`} onClick={() => { if (window.confirm(`حذف خدمة ${category.title} من هذه النسخة؟`)) setData((previous) => ({ ...previous, categories: previous.categories.filter((item) => item.id !== category.id) })); }} data-testid={`button-delete-category-${category.id}`}><X size={17} /></button></div>)}</div><form className="add-category-form" onSubmit={(event) => { event.preventDefault(); const title = newCategory.trim(); if (!title) return; const id = `custom-${Date.now().toString(36)}`; setData((previous) => ({ ...previous, categories: [...previous.categories, { id, title, description: 'خدمة صيانة مضافة في هذه التجربة.', icon: 'wrench' }] })); setNewCategory(''); }}><label htmlFor="new-category">إضافة فئة خدمة</label><div><input id="new-category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="اسم الخدمة الجديدة" data-testid="input-new-category" /><button className="button button-primary button-small" type="submit" disabled={!newCategory.trim()} data-testid="button-add-category">إضافة <Check size={15} /></button></div></form></div>}
    </div><div className="admin-footnote"><ShieldCheck size={16} /> جميع التغييرات تجريبية ويمكن إعادة ضبطها بمسح بيانات الموقع من المتصفح.</div>
  </div>;
}
function NotFoundPage() {
  return <div className="not-found"><span className="not-found-code">404</span><h1>هذه الصفحة غير موجودة</h1><p>ربما انتقلت إلى رابط غير متاح في تجربة FixMate.</p><Link href="/" className="button button-primary" data-testid="link-not-found-home">العودة للرئيسية <ArrowLeft size={16} /></Link></div>;
}
function Router() {
  const [location] = useLocation();
  return <Switch>
    <Route path="/"><Layout><HomePage /></Layout></Route>
    <Route path="/services"><Layout><ServicesPage /></Layout></Route>
    <Route path="/request"><Layout><RequestPage /></Layout></Route>
    <Route path="/technician-register"><Layout><TechnicianRegisterPage /></Layout></Route>
    <Route path="/login"><Layout><LoginPage /></Layout></Route>
    <Route path="/dashboard/customer"><Layout><CustomerDashboard /></Layout></Route>
    <Route path="/dashboard/technician"><Layout><TechnicianDashboard /></Layout></Route>
    <Route path="/dashboard/admin"><Layout><AdminDashboard /></Layout></Route>
    <Route><Layout><NotFoundPage /></Layout></Route>
  </Switch>;
}
function App() {
  const [data, setData] = useState<DemoState>(safeLoad);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable in private browsing. */ } }, [data]);
  const setRole = (role: Role) => setData((previous) => ({ ...previous, role }));
  const updateRequest = (id: string, update: Partial<MaintenanceRequest>) => setData((previous) => ({ ...previous, requests: previous.requests.map((request) => request.id === id ? { ...request, ...update } : request) }));
  const context = useMemo(() => ({ data, setData, setRole, updateRequest }), [data]);
  return <Store.Provider value={context}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter></Store.Provider>;
}

export default App;
